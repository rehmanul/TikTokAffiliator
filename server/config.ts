import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config();

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  STATIC_FILES: {
    maxAge: '1d',
    etag: true
  },
  COMPRESSION: {
    level: 6,
    threshold: 1024
  },
  SECURITY: {
    frameguard: {
      action: 'deny'
    },
    xssFilter: true,
    noSniff: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  }
} as const;

// Paths
export const PATHS = {
  root: path.resolve(import.meta.dirname, '..'),
  dist: path.resolve(import.meta.dirname, '..', 'dist'),
  public: path.resolve(import.meta.dirname, '..', 'dist', 'public'),
  client: path.resolve(import.meta.dirname, '..', 'client')
} as const;
