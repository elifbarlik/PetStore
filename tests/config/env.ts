import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Optional local overrides (tests/.env). Node >= 20.12 ships a built-in loader.
const envFile = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export const API_URL = process.env.API_URL ?? 'http://localhost:5294/api';
export const UI_URL = process.env.UI_URL ?? 'http://localhost:5173';

/** Backend origin without the /api suffix (used for static files and health checks). */
export const API_ORIGIN = new URL(API_URL).origin;

export const TEST_DB_CONNECTION =
  process.env.TEST_DB_CONNECTION ??
  'Server=(localdb)\\MSSQLLocalDB;Database=PetStore_Test;TrustServerCertificate=True;Trusted_Connection=True';

/**
 * JWT signing key for the backend started by the tests. The real key is never committed:
 * locally it lives in .NET user-secrets, in tests/CI a throw-away random key is used per run.
 */
export const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET ?? randomBytes(48).toString('base64');

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const BACKEND_PROJECT = path.join(
  REPO_ROOT,
  'back_end',
  'PetStoreAPI',
  'PetStoreAPI',
);
export const FRONTEND_DIR = path.join(REPO_ROOT, 'front_end');
