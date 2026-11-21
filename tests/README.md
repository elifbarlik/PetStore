# PetStore test suite

Playwright Test (TypeScript) suite covering the PetStore REST API and the React UI.
Test strategy, full test-case list and the defect log live in **[TEST_PLAN.md](TEST_PLAN.md)**.

## Prerequisites

* Windows with **SQL Server LocalDB** (ships with Visual Studio / SQL Server Express)
* **.NET 8** runtime + a .NET SDK (8 or 9), **Node.js 20.12+**
* Frontend dependencies installed once: `cd ../front_end && npm ci`

## Run

```bash
cd tests
npm ci
npx playwright install chromium
npm run db:setup     # creates/migrates the isolated PetStore_Test database (first time only)
npm test             # starts backend + frontend automatically, runs API + UI tests
```

| Command | What it does |
|---|---|
| `npm test` | Whole suite (both projects) |
| `npm run test:api` | REST API tests only |
| `npm run test:ui` | Browser tests only |
| `npm run test:headed` | UI tests in a visible browser |
| `npx playwright test --grep @smoke` | Smoke subset (core journeys) |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | `tsc --noEmit` over the test code |

Playwright's `webServer` starts the API (`dotnet run`, port 5294, pointed at `PetStore_Test`)
and the Vite dev server (port 5173). If you already have them running locally they are reused.
Override URLs or the DB connection string by copying `.env.example` to `.env`.

## Layout

```
tests/
├── playwright.config.ts     projects (api, ui), reporters, webServer, failure artefacts
├── config/env.ts            URLs, test DB connection string, paths
├── fixtures/
│   ├── test-data.ts         unique user/post factories, upload assets
│   └── auth.fixture.ts      api clients, session (register+login), authedPage, seedPost + cleanup
├── api/
│   ├── clients/             typed wrappers per endpoint group
│   └── specs/               *.api.spec.ts
├── pages/                   Page Object Model (Login, Register, Profile, AddPetModal, PetList, PetDetail)
├── ui/specs/                *.ui.spec.ts
├── assets/                  pet.png, not-an-image.txt
├── jmeter/                  JMeter load test (manual)
└── scripts/db-setup.mjs     EF Core migrations for the test DB
```

## Conventions

* **Test ids** (`API-CRT-01`, `UI-LOG-02`, …) appear in each test title and map 1:1 to the tables in `TEST_PLAN.md`.
* **Defects → regression tests.** A defect found while writing tests is first captured as the *correct* expectation
  wrapped in `test.fail(true, 'Known defect F-xx …')` (CI stays green, the defect stays visible). Once fixed, the
  annotation is removed and the test guards against regressions. All findings in `TEST_PLAN.md` §8 are fixed.
* **No raw selectors in specs** — everything goes through `pages/` or `api/clients/`.
* **Every test owns its data** — unique users per test, posts deleted in fixture teardown.

## Reports & failure evidence

* HTML report: `playwright-report/index.html`
* JUnit XML: `test-results/junit.xml` (used by the CI test summary)
* On failure: screenshot + video in `test-results/<test>/`; on CI retry also a trace (`npx playwright show-trace <zip>`).
