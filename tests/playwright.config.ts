import { defineConfig, devices } from '@playwright/test';
import {
  API_ORIGIN,
  API_URL,
  BACKEND_PROJECT,
  FRONTEND_DIR,
  TEST_DB_CONNECTION,
  TEST_JWT_SECRET,
  UI_URL,
} from './config/env';

const isCI = !!process.env.CI;

/**
 * Projects:
 *  - api: REST contract tests against the ASP.NET Core backend (no browser)
 *  - ui:  end-to-end browser tests against the React frontend (Page Object Model)
 *
 * Both servers are started automatically by `webServer` (one-command run).
 * Locally an already running server is reused.
 */
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './api/specs',
      use: {
        baseURL: `${API_URL}/`,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      name: 'ui',
      testDir: './ui/specs',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: UI_URL,
        locale: 'tr-TR',
      },
    },
  ],

  webServer: [
    {
      name: 'backend',
      command: `dotnet run --no-launch-profile --project "${BACKEND_PROJECT}" --urls ${API_ORIGIN}`,
      url: `${API_URL}/post/GetAllPosts`,
      cwd: BACKEND_PROJECT,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__DefaultConnection: TEST_DB_CONNECTION,
        ApiSettings__JwtOptions__Secret: TEST_JWT_SECRET,
      },
    },
    {
      name: 'frontend',
      command: `npx vite --port ${new URL(UI_URL).port} --strictPort`,
      url: UI_URL,
      cwd: FRONTEND_DIR,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        VITE_API_URL: API_URL,
        // Dummy Firebase config: the app refuses to boot without it. Chat (Firestore)
        // is out of scope for this suite, so no real project is contacted.
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'petstore-test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'petstore-test',
        VITE_FIREBASE_STORAGE_BUCKET: 'petstore-test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
        VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
      },
    },
  ],
});
