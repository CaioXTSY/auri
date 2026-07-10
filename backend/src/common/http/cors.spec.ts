import { getAllowedOrigins, isOriginAllowed } from './cors';

describe('CORS origins', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses configured origins and never treats wildcard as an allowed origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://auri.example, *';
    process.env.PORT = '3001';
    delete process.env.BACKEND_URL;

    expect(getAllowedOrigins()).toContain('https://auri.example');
    expect(isOriginAllowed('https://auri.example')).toBe(true);
    expect(isOriginAllowed('https://untrusted.example')).toBe(false);
  });
});
