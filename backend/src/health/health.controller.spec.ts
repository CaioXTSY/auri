import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports API and database availability without exposing internals', async () => {
    const controller = new HealthController({
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ 1: 1 }]),
    } as never);

    const response = await controller.check();

    expect(response).toMatchObject({ status: 'ok', database: 'connected' });
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns a sanitized 503 response when the database is unavailable', async () => {
    const controller = new HealthController({
      $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('connection password=secret failed')),
    } as never);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
    await controller.check().catch((error: ServiceUnavailableException) => {
      expect(error.getResponse()).toMatchObject({ status: 'error', database: 'unavailable' });
      expect(JSON.stringify(error.getResponse())).not.toContain('secret');
    });
  });
});
