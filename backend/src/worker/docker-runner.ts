import { spawn } from 'child_process';
import { CodeSubmissionStatus } from '@prisma/client';
import { appendLimited } from './output-normalizer';

export type DockerRunResult = {
  status: CodeSubmissionStatus;
  stdout: string;
  stderr: string;
  runtimeMs: number;
};

export type DockerRunOptions = {
  image: string;
  timeoutMs: number;
  memoryMb: number;
  cpus: string;
  maxOutputBytes: number;
  env: string[];
  command: string[];
};

export function runDocker(options: DockerRunOptions): Promise<DockerRunResult> {
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
    options.cpus,
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
      stdout = appendLimited(stdout, chunk.toString('utf8'), options.maxOutputBytes);
      if (Buffer.byteLength(stdout, 'utf8') >= options.maxOutputBytes) {
        outputLimitExceeded = true;
        requestContainerStop();
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr = appendLimited(stderr, chunk.toString('utf8'), options.maxOutputBytes);
      if (Buffer.byteLength(stderr, 'utf8') >= options.maxOutputBytes) {
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
  await runDockerCli(['rm', '-f', containerName]).catch((): void => undefined);
}

function runDockerCli(args: string[], timeoutMs = 5000): Promise<void> {
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
      stderr = appendLimited(stderr, chunk.toString('utf8'), 64 * 1024);
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
