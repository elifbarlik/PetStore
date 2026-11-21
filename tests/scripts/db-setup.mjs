// Creates / migrates the isolated test database (PetStore_Test by default).
// Usage: npm run db:setup
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const connection =
  process.env.TEST_DB_CONNECTION ??
  'Server=(localdb)\\MSSQLLocalDB;Database=PetStore_Test;TrustServerCertificate=True;Trusted_Connection=True';

const project = path.resolve(here, '..', '..', 'back_end', 'PetStoreAPI', 'PetStoreAPI');

// EF design-time builds the app host, which requires a JWT key; migrations never use it.
const env = {
  ...process.env,
  ApiSettings__JwtOptions__Secret:
    process.env.ApiSettings__JwtOptions__Secret ?? randomBytes(48).toString('base64'),
};

const run = (args) =>
  execFileSync('dotnet', args, { cwd: project, stdio: 'inherit', env });

console.log(`Applying EF Core migrations to: ${connection.replace(/Password=[^;]*/i, 'Password=***')}`);
run(['tool', 'restore']);
run(['ef', 'database', 'update', '--connection', connection]);
