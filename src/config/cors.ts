export const CORS_CONFIG = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
} as const;

export type CorsConfig = typeof CORS_CONFIG;