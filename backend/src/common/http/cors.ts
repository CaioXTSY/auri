const DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function getAllowedOrigins() {
  const corsEnv =
    process.env.CORS_ORIGINS ||
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    '';
  const origins = corsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');

  if (process.env.NODE_ENV !== 'production') {
    for (const origin of DEVELOPMENT_ORIGINS) {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    }
  }

  const port = process.env.PORT || '3001';
  const localBackendOrigin = `http://localhost:${port}`;
  if (!origins.includes(localBackendOrigin)) {
    origins.push(localBackendOrigin);
  }

  const backendUrl = process.env.BACKEND_URL?.trim();
  if (backendUrl && !origins.includes(backendUrl)) {
    origins.push(backendUrl);
  }

  return origins;
}

export function isOriginAllowed(origin?: string) {
  return !origin || getAllowedOrigins().includes(origin);
}
