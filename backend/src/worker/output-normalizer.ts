import { CodeSubmissionStatus } from '@prisma/client';

export function getFinalStatus(statuses: CodeSubmissionStatus[]) {
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

export function normalizeOutput(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/g, '');
}

export function preview(value: string) {
  return value.length > 2000 ? `${value.slice(0, 2000)}...` : value;
}

export function appendLimited(current: string, next: string, maxOutputBytes: number) {
  const combined = current + next;
  if (Buffer.byteLength(combined, 'utf8') <= maxOutputBytes) {
    return combined;
  }

  return combined.slice(0, maxOutputBytes);
}
