const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001')
  .replace(/\/api\/v\d+\/?$/, '')
  .replace(/\/+$/, '');

export const getAssetUrl = (path?: string | null) => {
  if (!path) return null;

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};
