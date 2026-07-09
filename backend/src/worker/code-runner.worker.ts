import {
  CodeSubmissionMode,
  CodeSubmissionStatus,
  PrismaClient,
  ProgrammingLanguage,
  TestCaseVisibility,
} from '@prisma/client';
import { ProgrammingGamificationService } from '../modules/programming/programming-gamification.service';
import { runDocker, type DockerRunResult } from './docker-runner';
import { getFinalStatus, normalizeOutput, preview } from './output-normalizer';

type ClaimedSubmission = Awaited<ReturnType<typeof loadSubmission>>;

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
      cpus: config.defaultCpus,
      maxOutputBytes: config.maxOutputBytes,
      env: buildRunnerEnv(submission.code, input),
      command: ['node', '-e', javascriptLauncher],
    });
  }

  return runDocker({
    image: config.pyImage,
    timeoutMs,
    memoryMb: submission.problem.memoryLimitMb ?? config.defaultMemoryMb,
    cpus: config.defaultCpus,
    maxOutputBytes: config.maxOutputBytes,
    env: buildRunnerEnv(submission.code, input),
    command: ['python', '-c', pythonLauncher],
  });
}

function buildRunnerEnv(code: string, input: string) {
  return [
    `AURI_CODE_B64=${Buffer.from(code, 'utf8').toString('base64')}`,
    `AURI_INPUT_B64=${Buffer.from(input, 'utf8').toString('base64')}`,
  ];
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

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
