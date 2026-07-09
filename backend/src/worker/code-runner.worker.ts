import { spawn } from 'child_process';
import {
  CodeSubmissionMode,
  CodeSubmissionStatus,
  PrismaClient,
  ProgrammingLanguage,
  TestCaseVisibility,
} from '@prisma/client';
import { ProgrammingGamificationService } from '../modules/programming/programming-gamification.service';

type ClaimedSubmission = Awaited<ReturnType<typeof loadSubmission>>;

type DockerRunResult = {
  status: CodeSubmissionStatus;
  stdout: string;
  stderr: string;
  runtimeMs: number;
};

const prisma = new PrismaClient();
const programmingGamification = new ProgrammingGamificationService(prisma);

const config = {
  enabled: process.env.CODE_RUNNER_ENABLED !== 'false',
  pollIntervalMs: numberFromEnv('CODE_RUNNER_POLL_INTERVAL_MS', 1000),
  maxParallel: numberFromEnv('CODE_RUNNER_MAX_PARALLEL', 2),
  jsImage: process.env.CODE_RUNNER_JS_IMAGE ?? 'node:20-alpine',
  pyImage: process.env.CODE_RUNNER_PY_IMAGE ?? 'python:3.12-alpine',
  defaultTimeoutMs: numberFromEnv('CODE_RUNNER_DEFAULT_TIMEOUT_MS', 2000),
  defaultMemoryMb: numberFromEnv('CODE_RUNNER_DEFAULT_MEMORY_MB', 128),
  defaultCpus: process.env.CODE_RUNNER_DEFAULT_CPUS ?? '0.5',
  maxOutputBytes: numberFromEnv('CODE_RUNNER_MAX_OUTPUT_BYTES', 64 * 1024),
};

let shuttingDown = false;

async function main() {
  if (!config.enabled) {
    console.log('Code runner disabled by CODE_RUNNER_ENABLED=false');
    return;
  }

  process.on('SIGINT', requestShutdown);
  process.on('SIGTERM', requestShutdown);

  console.log(
    `Code runner started. parallel=${config.maxParallel} poll=${config.pollIntervalMs}ms`,
  );

  await Promise.all(Array.from({ length: config.maxParallel }, (_, index) => workerLoop(index)));
}

async function workerLoop(index: number) {
  while (!shuttingDown) {
    const submission = await claimNextSubmission();

    if (!submission) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    try {
      console.log(`[runner:${index}] judging submission ${submission.id}`);
      await judgeSubmission(submission.id);
    } catch (error) {
      console.error(
        `[runner:${index}] failed submission ${submission.id}`,
        error instanceof Error ? error.stack : error,
      );

      await prisma.codeSubmission.update({
        where: { id: submission.id },
        data: {
          status: CodeSubmissionStatus.INTERNAL_ERROR,
          errorMessage: error instanceof Error ? error.message : 'Erro interno no judge',
          judgedAt: new Date(),
        },
      });
    }
  }
}

async function claimNextSubmission() {
  const candidate = await prisma.codeSubmission.findFirst({
    where: { status: CodeSubmissionStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!candidate) {
    return null;
  }

  const claimed = await prisma.codeSubmission.updateMany({
    where: {
      id: candidate.id,
      status: CodeSubmissionStatus.PENDING,
    },
    data: {
      status: CodeSubmissionStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  return claimed.count === 1 ? candidate : null;
}

async function judgeSubmission(submissionId: string) {
  const submission = await loadSubmission(submissionId);

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  await prisma.submissionTestResult.deleteMany({
    where: { submissionId },
  });

  const testCases =
    submission.mode === CodeSubmissionMode.RUN
      ? submission.problem.testCases.filter(
          (testCase) => testCase.visibility === TestCaseVisibility.PUBLIC,
        )
      : submission.problem.testCases;

  if (testCases.length === 0) {
    throw new Error('Problem has no test cases');
  }

  const results = [];
  for (const testCase of testCases) {
    const result = await runSingleTest(submission, testCase.input);
    const normalizedActual = normalizeOutput(result.stdout);
    const normalizedExpected = normalizeOutput(testCase.expected);
    const status =
      result.status === CodeSubmissionStatus.ACCEPTED && normalizedActual !== normalizedExpected
        ? CodeSubmissionStatus.WRONG_ANSWER
        : result.status;

    const isPublic = testCase.visibility === TestCaseVisibility.PUBLIC;
    const saved = await prisma.submissionTestResult.create({
      data: {
        submissionId,
        testCaseId: testCase.id,
        status,
        inputPreview: isPublic ? preview(testCase.input) : null,
        expected: isPublic ? testCase.expected : null,
        actual: isPublic ? result.stdout : null,
        errorMessage: isPublic ? result.stderr || null : null,
        runtimeMs: result.runtimeMs,
      },
    });

    results.push(saved);
  }

  const passedTestIds = new Set(
    results
      .filter((result) => result.status === CodeSubmissionStatus.ACCEPTED)
      .map((result) => result.testCaseId)
      .filter(Boolean),
  );
  const passedTests = passedTestIds.size;
  const finalStatus = getFinalStatus(results.map((result) => result.status));
  const totalWeight = testCases.reduce((total, testCase) => total + testCase.weight, 0);
  const passedWeight = testCases.reduce(
    (total, testCase) => (passedTestIds.has(testCase.id) ? total + testCase.weight : total),
    0,
  );
  const maxScore =
    submission.mode === CodeSubmissionMode.SUBMIT ? (submission.assignment?.points ?? 100) : 100;
  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * maxScore) : 0;
  const runtimeMs = results.reduce((total, result) => total + (result.runtimeMs ?? 0), 0);
  await prisma.codeSubmission.update({
    where: { id: submissionId },
    data: {
      status: finalStatus,
      score,
      passedTests,
      totalTests: testCases.length,
      runtimeMs,
      judgedAt: new Date(),
      errorMessage: finalStatus === CodeSubmissionStatus.ACCEPTED ? null : finalStatus,
    },
  });

  if (submission.mode === CodeSubmissionMode.SUBMIT) {
    try {
      const pointsAwarded = await programmingGamification.processSubmission(
        submission.id,
        finalStatus,
      );

      await prisma.codeSubmission.update({
        where: { id: submissionId },
        data: { pointsAwarded },
      });
    } catch (error) {
      console.error(
        `[gamification] failed for submission ${submission.id}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}

function loadSubmission(id: string) {
  return prisma.codeSubmission.findUnique({
    where: { id },
    include: {
      problem: {
        include: {
          testCases: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      assignment: true,
    },
  });
}

async function runSingleTest(
  submission: NonNullable<ClaimedSubmission>,
  input: string,
): Promise<DockerRunResult> {
  const timeoutMs = submission.problem.timeLimitMs ?? config.defaultTimeoutMs;

  if (submission.language === ProgrammingLanguage.JAVASCRIPT) {
    return runDocker({
      image: config.jsImage,
      timeoutMs,
      memoryMb: submission.problem.memoryLimitMb ?? config.defaultMemoryMb,
      env: buildRunnerEnv(submission.code, input),
      command: ['node', '-e', javascriptLauncher],
    });
  }

  return runDocker({
    image: config.pyImage,
    timeoutMs,
    memoryMb: submission.problem.memoryLimitMb ?? config.defaultMemoryMb,
    env: buildRunnerEnv(submission.code, input),
    command: ['python', '-c', pythonLauncher],
  });
}

function runDocker(options: {
  image: string;
  timeoutMs: number;
  memoryMb: number;
  env: string[];
  command: string[];
}): Promise<DockerRunResult> {
  const containerName = createDockerContainerName();
  const args = [
    'run',
    '--rm',
    '--name',
    containerName,
    '--label',
    'auri.code-runner=true',
    '--label',
    `auri.code-runner.name=${containerName}`,
    '--network',
    'none',
    '--memory',
    `${options.memoryMb}m`,
    '--memory-swap',
    `${options.memoryMb}m`,
    '--cpus',
    config.defaultCpus,
    '--user',
    '1000:1000',
    '--read-only',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=16m',
    '--pids-limit',
    '64',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    ...options.env.flatMap((env) => ['-e', env]),
    options.image,
    ...options.command,
  ];

  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child = spawn('docker', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;
    let outputLimitExceeded = false;
    let stopRequested = false;

    const requestContainerStop = () => {
      if (stopRequested) {
        return;
      }

      stopRequested = true;
      void killDockerContainer(containerName)
        .finally(() => removeDockerContainer(containerName))
        .finally(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        });
    };

    const timer = setTimeout(() => {
      killedByTimeout = true;
      requestContainerStop();
    }, options.timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout = appendLimited(stdout, chunk.toString('utf8'));
      if (Buffer.byteLength(stdout, 'utf8') >= config.maxOutputBytes) {
        outputLimitExceeded = true;
        requestContainerStop();
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr = appendLimited(stderr, chunk.toString('utf8'));
      if (Buffer.byteLength(stderr, 'utf8') >= config.maxOutputBytes) {
        outputLimitExceeded = true;
        requestContainerStop();
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        status: CodeSubmissionStatus.INTERNAL_ERROR,
        stdout,
        stderr: error.message,
        runtimeMs: Date.now() - startedAt,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      let status: CodeSubmissionStatus = CodeSubmissionStatus.ACCEPTED;
      if (killedByTimeout) {
        status = CodeSubmissionStatus.TIME_LIMIT_EXCEEDED;
      } else if (outputLimitExceeded) {
        status = CodeSubmissionStatus.RUNTIME_ERROR;
        stderr = 'Limite de saida excedido';
      } else if (code === 137) {
        status = CodeSubmissionStatus.MEMORY_LIMIT_EXCEEDED;
      } else if (code !== 0) {
        status = CodeSubmissionStatus.RUNTIME_ERROR;
      }

      resolve({
        status,
        stdout,
        stderr,
        runtimeMs: Date.now() - startedAt,
      });
    });
  });
}

function createDockerContainerName() {
  const randomSuffix = Math.random().toString(16).slice(2, 10);

  return `auri-code-runner-${process.pid}-${Date.now()}-${randomSuffix}`;
}

async function killDockerContainer(containerName: string) {
  await runDockerCli(['kill', containerName]).catch((error) => {
    console.warn(
      `[docker] failed to kill container ${containerName}`,
      error instanceof Error ? error.message : error,
    );
  });
}

async function removeDockerContainer(containerName: string) {
  await runDockerCli(['rm', '-f', containerName]).catch(() => undefined);
}

function runDockerCli(args: string[], timeoutMs = 5000) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('docker', args, {
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error(`docker ${args[0]} timed out`));
    }, timeoutMs);

    function finish(error?: Error) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);

      if (error) {
        reject(error);
        return;
      }

      resolve();
    }

    child.stderr.on('data', (chunk: Buffer) => {
      stderr = appendLimited(stderr, chunk.toString('utf8'));
    });

    child.on('error', (error) => finish(error));
    child.on('close', (code) => {
      if (code === 0) {
        finish();
        return;
      }

      finish(new Error(stderr || `docker ${args[0]} exited with ${code}`));
    });
  });
}

function buildRunnerEnv(code: string, input: string) {
  return [
    `AURI_CODE_B64=${Buffer.from(code, 'utf8').toString('base64')}`,
    `AURI_INPUT_B64=${Buffer.from(input, 'utf8').toString('base64')}`,
  ];
}

function getFinalStatus(statuses: CodeSubmissionStatus[]) {
  if (statuses.every((status) => status === CodeSubmissionStatus.ACCEPTED)) {
    return CodeSubmissionStatus.ACCEPTED;
  }

  for (const status of [
    CodeSubmissionStatus.TIME_LIMIT_EXCEEDED,
    CodeSubmissionStatus.MEMORY_LIMIT_EXCEEDED,
    CodeSubmissionStatus.RUNTIME_ERROR,
    CodeSubmissionStatus.INTERNAL_ERROR,
  ]) {
    if (statuses.includes(status)) {
      return status;
    }
  }

  return CodeSubmissionStatus.WRONG_ANSWER;
}

function normalizeOutput(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/g, '');
}

function preview(value: string) {
  return value.length > 2000 ? `${value.slice(0, 2000)}...` : value;
}

function appendLimited(current: string, next: string) {
  const combined = current + next;
  if (Buffer.byteLength(combined, 'utf8') <= config.maxOutputBytes) {
    return combined;
  }

  return combined.slice(0, config.maxOutputBytes);
}

function numberFromEnv(key: string, fallback: number) {
  const raw = process.env[key];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestShutdown() {
  shuttingDown = true;
  console.log('Code runner shutting down...');
}

const javascriptLauncher = `
const code = Buffer.from(process.env.AURI_CODE_B64 || "", "base64").toString("utf8");
const input = Buffer.from(process.env.AURI_INPUT_B64 || "", "base64").toString("utf8");
const solutionModule = { exports: {} };
const solutionExports = solutionModule.exports;
const loadSolution = new Function("module", "exports", "require", code + "\\n; return module.exports;");
const solve = loadSolution(solutionModule, solutionExports, require);

Promise.resolve(solve(input))
  .then((result) => {
    process.stdout.write(String(result ?? ""));
  })
  .catch((err) => {
    console.error(err?.message || String(err));
    process.exit(1);
  });
`.trimStart();

const pythonLauncher = `
import base64
import os
import sys

code = base64.b64decode(os.environ.get("AURI_CODE_B64", "")).decode("utf-8")
input_value = base64.b64decode(os.environ.get("AURI_INPUT_B64", "")).decode("utf-8")
namespace = {}

try:
    exec(compile(code, "solution.py", "exec"), namespace)
    solve = namespace["solve"]
    result = solve(input_value)
    sys.stdout.write("" if result is None else str(result))
except Exception as exc:
    sys.stderr.write(str(exc))
    sys.exit(1)
`.trimStart();

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
