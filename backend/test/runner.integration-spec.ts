import { execFileSync } from 'child_process';
import { CodeSubmissionStatus } from '@prisma/client';
import { runDocker, type DockerRunOptions } from '../src/worker/docker-runner';

const dockerAvailable = () => {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

const describeWithDocker = dockerAvailable() ? describe : describe.skip;

const baseOptions: Omit<DockerRunOptions, 'image' | 'command'> = {
  timeoutMs: 2000,
  startupGraceMs: 8000,
  memoryMb: 128,
  cpus: '0.5',
  maxOutputBytes: 4096,
  env: [],
};

describeWithDocker('Docker code runner integration', () => {
  it('executes JavaScript and returns stdout', async () => {
    const result = await runDocker({
      ...baseOptions,
      image: 'node:20-alpine',
      command: ['node', '-e', 'process.stdout.write("javascript-ok")'],
    });

    expect(result).toMatchObject({ status: CodeSubmissionStatus.ACCEPTED, stdout: 'javascript-ok' });
  });

  it('executes Python and returns stdout', async () => {
    const result = await runDocker({
      ...baseOptions,
      image: 'python:3.12-alpine',
      command: ['python', '-c', 'print("python-ok", end="")'],
    });

    expect(result).toMatchObject({ status: CodeSubmissionStatus.ACCEPTED, stdout: 'python-ok' });
  });

  it('enforces the configured execution timeout', async () => {
    const result = await runDocker({
      ...baseOptions,
      timeoutMs: 500,
      image: 'node:20-alpine',
      command: ['node', '-e', 'while (true) {}'],
    });

    expect(result.status).toBe(CodeSubmissionStatus.TIME_LIMIT_EXCEEDED);
    expect(result.runtimeMs).toBeLessThanOrEqual(500);
  });

  it('does not allow outbound network access', async () => {
    const result = await runDocker({
      ...baseOptions,
      image: 'node:20-alpine',
      command: [
        'node',
        '-e',
        'require("https").get("https://example.com").on("error", () => { process.stdout.write("network-blocked"); process.exit(0); }); setTimeout(() => process.exit(1), 1500)',
      ],
    });

    expect(result).toMatchObject({ status: CodeSubmissionStatus.ACCEPTED, stdout: 'network-blocked' });
  });

  it('runs with a read-only root filesystem', async () => {
    const result = await runDocker({
      ...baseOptions,
      image: 'node:20-alpine',
      command: [
        'node',
        '-e',
        'try { require("fs").writeFileSync("/auri-read-only-check", "x"); process.exit(1); } catch { process.stdout.write("read-only"); }',
      ],
    });

    expect(result).toMatchObject({ status: CodeSubmissionStatus.ACCEPTED, stdout: 'read-only' });
  });
});
