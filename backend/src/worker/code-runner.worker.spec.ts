import { CodeSubmissionStatus } from '@prisma/client';
import { getFinalStatus, normalizeOutput } from './code-runner.worker';

describe('code-runner.worker', () => {
  describe('getFinalStatus', () => {
    it('should accept when all tests passed', () => {
      expect(getFinalStatus([CodeSubmissionStatus.ACCEPTED, CodeSubmissionStatus.ACCEPTED])).toBe(
        CodeSubmissionStatus.ACCEPTED,
      );
    });

    it('should return wrong answer when execution is valid but at least one test failed', () => {
      expect(
        getFinalStatus([CodeSubmissionStatus.ACCEPTED, CodeSubmissionStatus.WRONG_ANSWER]),
      ).toBe(CodeSubmissionStatus.WRONG_ANSWER);
    });

    it('should prioritize timeout over wrong answer', () => {
      expect(
        getFinalStatus([
          CodeSubmissionStatus.WRONG_ANSWER,
          CodeSubmissionStatus.TIME_LIMIT_EXCEEDED,
        ]),
      ).toBe(CodeSubmissionStatus.TIME_LIMIT_EXCEEDED);
    });

    it('should prioritize runtime error over wrong answer', () => {
      expect(
        getFinalStatus([CodeSubmissionStatus.WRONG_ANSWER, CodeSubmissionStatus.RUNTIME_ERROR]),
      ).toBe(CodeSubmissionStatus.RUNTIME_ERROR);
    });
  });

  describe('normalizeOutput', () => {
    it('should trim trailing spaces per line and trailing blank lines', () => {
      expect(normalizeOutput('5   \r\nok  \n\n')).toBe('5\nok');
    });
  });
});
