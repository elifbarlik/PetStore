# PetStore — Test Plan & Test Cases

| | |
|---|---|
| **System under test** | PetStore — React 19 SPA (`front_end/`) + ASP.NET Core 8 Web API (`back_end/`) + SQL Server |
| **Test levels** | REST API (contract/functional) · End-to-end UI (browser) · Load (JMeter) |
| **Tooling** | Playwright Test (TypeScript), GitHub Actions, Apache JMeter |
| **Suite size** | 92 automated tests — 55 API + 37 UI — plus 1 JMeter load plan |

---

## 1. Objectives

1. Verify the core user journeys — **register → log in → publish a listing → browse → adopt → manage** — end to end.
2. Pin down the **REST contract** of every endpoint (HTTP status, `ResponseDto` envelope, messages) so regressions are caught automatically.
3. Exercise **negative paths**: client-side validation, server-side validation, authentication/authorization failures, invalid uploads, concurrency.
4. Turn every defect found during test design into a **regression test** (see §8).
5. Run the whole suite on every push/PR with a single command and publish an HTML report with failure evidence.

## 2. Scope

### In scope
| Area | Endpoints / pages |
|---|---|
| Authentication | `POST /api/user/Register`, `POST /api/user/Login` (incl. lockout); `/auth/login`, `/auth/register` |
| Listings (read) | `GET /api/post/GetAllPosts`, `GetPostById/{id}`, `GetPostsByUserId/{userId}`; `/ilanlar`, `/ilan/:id` |
| Listings (write) | `POST CreatePost` (multipart upload), `PUT UpdatePost`, `DELETE DeletePost/{id}`; profile page, "İlan Ekle" dialog |
| Adoption | `POST AdoptPost/{id}`, `POST CancelAdoption/{id}`; detail page *Sahiplen*, profile *Sahiplenmeyi iptal et* |
| Access control & session | JWT validation (missing / tampered), ownership rules, protected routes, expired-token handling, post-login redirect |
| Performance | `GET /api/post/GetAllPosts` under concurrent load (JMeter, §10) |

### Out of scope (and why)
| Area | Reason |
|---|---|
| Real-time chat (Firebase Firestore) | Needs a live Firebase project + service-account secret; not reproducible in CI. The UI suite boots the SPA with dummy Firebase config. |
| AI description generator (`ai/` Flask service) | External LLM; non-deterministic output. |
| Cross-browser / mobile viewports | Chromium desktop only to keep CI fast; adding Firefox/WebKit is a one-line `projects` change. |

## 3. Approach

* **Single framework.** Playwright Test drives both the browser (`ui` project) and raw HTTP (`api` project, via `APIRequestContext`) — one runner, one report, one CI job.
* **Page Object Model.** Every page/dialog has a class in `pages/`; specs contain no raw selectors. Locator priority: `getByRole` → `getByLabel` → `getByTestId` (test ids only on the "İlan Ekle" dialog inputs).
* **API clients.** `api/clients/*` wrap each endpoint and return the raw response, so specs assert HTTP status *and* body.
* **Regression-first defect handling.** A defect found during test design is first written as the *correct* expectation wrapped in `test.fail()` (CI stays green, the defect stays visible). When the fix lands the annotation is removed and the test becomes a normal regression test.
* **Test data isolation.** Each test registers its own uniquely-named users through the real API (`fixtures/test-data.ts`) and creates its own posts; fixture teardown deletes them (cancelling adoptions first). The backend runs against a dedicated `PetStore_Test` database.
* **Fast UI setup.** UI tests that are *not* about logging in inject the JWT into `localStorage` before the app boots (`authedPage` fixture).

## 4. Test environment

| Component | Local | CI (GitHub Actions) |
|---|---|---|
| OS | Windows 11 | `windows-latest` |
| Backend | `dotnet run` on `http://localhost:5294` (started by Playwright `webServer`) | same |
| Frontend | Vite dev server on `http://localhost:5173` (started by Playwright `webServer`) | same, plus `npm run lint` and a production build |
| Database | SQL Server LocalDB, DB `PetStore_Test` (`npm run db:setup`) | LocalDB installed by `potatoqualitee/mssqlsuite` |
| Browser | Chromium (Playwright build) | same |
| Retries | 0 | 1 (trace recorded on retry) |

## 5. Entry & exit criteria

**Entry:** backend builds; EF migrations apply cleanly to `PetStore_Test`; frontend lints and builds.

**Exit (definition of done):** all tests pass on two consecutive runs; no skipped tests; HTML report, JUnit XML and failure screenshots/videos/traces published as CI artifacts.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| No DB reset → data accumulates across local runs | Unique names per test; teardown deletes created posts; assertions never rely on global counts. |
| Uploaded images named `{postId}.{ext}` could overwrite the tracked `wwwroot/PostImages/1.jpg` | Tests upload **PNG only**. |
| Account lockout tests could lock shared users | Every lockout test registers its own user. |
| LocalDB unavailable on Linux runners | CI runs on Windows. A Linux + SQL Server container variant was considered and deferred. |
| Flaky UI timing | Web-first assertions only, no fixed sleeps; one retry in CI with trace capture; suite verified green twice in a row locally and once in CI mode (`CI=1`). |

---

## 7. Test cases & traceability

Priority: **P1** = core journey / smoke (`@smoke`), **P2** = important negative path, **P3** = edge case.
*(F-xx)* = regression test for a fixed finding in §8. Every row below is **passing**.

### 7.1 API — Registration (`api/specs/register.api.spec.ts`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| API-REG-01 | New user registers | 200, envelope `isSuccess/statusCode 200`, profile with GUID id, password never returned | P1 |
| API-REG-02 | Duplicate user name | 400 `Username already taken` | P2 |
| API-REG-03 | Duplicate e-mail, different case | 400 `Email already taken` | P2 |
| API-REG-04 | Password policy | 400 listing length / non-alphanumeric / digit / uppercase rules | P2 |
| API-REG-05 | Invalid user-name characters | 400 `Username 'has space' is invalid…` | P3 |
| API-REG-06 | Missing e-mail *(F-01)* | 400, `result.Email = ["Email zorunludur."]` | P2 |
| API-REG-07 | Malformed e-mail | 400, `Geçerli bir email adresi giriniz.` | P2 |
| API-REG-08 | Empty body | 400 with errors for all 5 required fields | P3 |

### 7.2 API — Login (`login.api.spec.ts`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| API-LOG-01 | Valid credentials | 200; JWT with `sub`, `email`, `iss`, `aud`, future `exp` | P1 |
| API-LOG-02 | Wrong password | 400 `Kullanıcı adı veya şifre yanlış.` | P1 |
| API-LOG-03 | Unknown user | Same message as wrong password (no account enumeration) | P2 |
| API-LOG-04 | Full profile in response *(F-02)* | `user` has name, surname, email, userName | P2 |
| API-LOG-05 | Case-insensitive user name | 200 | P3 |
| API-LOG-06 | Brute-force lockout | 5th failure → lockout message; correct password refused while locked | P1 |
| API-LOG-07 | Successful login resets counter | 4 + 4 failures around a success never lock | P3 |
| API-LOG-08 | Missing credentials | 400 field errors for `UserName`, `Password` | P3 |

### 7.3 API — Listings read (`posts-read.api.spec.ts`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| API-READ-01 | GetAllPosts includes a new post | id present | P1 |
| API-READ-02 | Ordering | newest first | P3 |
| API-READ-03 | GetPostById | fields + owner; `postTime` is UTC (`…Z`) and current | P1 |
| API-READ-04 | Missing id *(F-05)* | **HTTP 404**, envelope `statusCode 404` | P2 |
| API-READ-05 | Non-numeric id | 404 (route constraint) | P3 |
| API-READ-06 | GetPostsByUserId filters by owner | only that user's posts, newest first | P2 |
| API-READ-07 | User without posts *(F-06)* | 200, `isSuccess=true`, `result=[]` | P2 |

### 7.4 API — Create / update / delete (`posts-create`, `posts-update`, `posts-delete`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| API-CRT-01 | Create with PNG | **201**; `imageUrl` `/PostImages/{id}.png` served as `image/png` | P1 |
| API-CRT-02 | Create without image | 201; placeholder URL | P2 |
| API-CRT-03 | No token | 401 | P1 |
| API-CRT-04 | Tampered JWT | 401 | P2 |
| API-CRT-05 | Missing `UserId` | 400, `result.UserId` | P2 |
| API-CRT-06 | `UserId` ≠ caller | 403 | P2 |
| API-CRT-07 | `.txt` upload | 400 `Geçersiz dosya formatı…` | P2 |
| API-CRT-08 | Rejected upload leaves no data *(F-03)* | user still has 0 posts | P2 |
| API-CRT-09 | Post on behalf of another user *(F-04)* | 403; victim has no posts | P1 |
| API-CRT-10 | Empty title / pet name / type / description *(F-09)* | 400 with one error per field | P1 |
| API-CRT-11 | Title > 100 chars | 400 length error | P3 |
| API-CRT-12 | `.png` name, non-image content | 400 `Dosya içeriği bir resim değil.` (magic-byte check) | P2 |
| API-CRT-13 | Image > 5 MB | 400 size error | P2 |
| API-UPD-01 | Owner updates text fields | 200; fields changed, photo kept | P1 |
| API-UPD-02 | Owner adds a photo | new file served | P2 |
| API-UPD-03 | Another user updates *(F-04)* | 403; post unchanged | P1 |
| API-UPD-04 | Missing post | 404 | P3 |
| API-DEL-01 | Owner deletes | 200; post 404 afterwards; image file 404 | P1 |
| API-DEL-02 | No token | 401; post still exists | P1 |
| API-DEL-03 | Unknown id | 404 | P3 |
| API-DEL-04 | Another user deletes *(F-04)* | 403; post still exists | P1 |
| API-DEL-05 | Adopted post *(F-07)* | 400 until the owner cancels the adoption, then 200 | P2 |

### 7.5 API — Adoption (`posts-adopt.api.spec.ts`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| API-ADP-01 | Another user adopts | 200; `isAdopted` persisted; message with pet name | P1 |
| API-ADP-02 | Adopt twice | 400 `Bu ilan zaten sahiplenilmiş.` | P2 |
| API-ADP-03 | No token | 401 | P1 |
| API-ADP-04 | Unknown id | 404 | P3 |
| API-ADP-05 | Owner cancels | 200; `isAdopted=false` | P2 |
| API-ADP-06 | Cancel when not adopted | 400 | P3 |
| API-ADP-07 | Owner adopts own post *(F-04)* | 403; flag unchanged | P2 |
| API-ADP-08 | Non-owner cancels *(F-04)* | 403; flag unchanged | P2 |
| API-ADP-09 | 3 concurrent adopt requests | exactly one 200, two 400 (atomic update) | P2 |
| API-ADP-10 | Re-adopt after cancel | 200 | P3 |

### 7.6 UI — Authentication (`ui/specs/login.ui.spec.ts`, `register.ui.spec.ts`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| UI-LOG-01 | Successful login | redirect to `/`, header shows *Profil*, JWT stored | P1 |
| UI-LOG-02 | Wrong password | banner with backend message, no token | P1 |
| UI-LOG-03 | Empty form | required-field messages | P2 |
| UI-LOG-04 | Too short values | min-length messages | P2 |
| UI-LOG-05 | Logout | header shows *Giriş Yap*; `token` and `user` removed | P2 |
| UI-LOG-06 | Logged-in user opens `/auth/login` | redirected home | P3 |
| UI-LOG-07 | Login error then *Kayıt Ol* | register page starts without a stale error | P3 |
| UI-REG-01 | Successful registration | toast, redirect to login, account usable | P1 |
| UI-REG-02 | Required name/surname | messages | P2 |
| UI-REG-03 | Weak password | password-rule message | P2 |
| UI-REG-04 | Invalid e-mail | format message | P2 |
| UI-REG-05 | Taken user name | banner `Username already taken` | P2 |
| UI-REG-06 | Submit label *(F-08)* | button reads *Kayıt Ol* | P3 |

### 7.7 UI — Listings & session (`listing-browse`, `listing-create`, `protected-route`)
| ID | Behaviour | Expected result | Pri |
|---|---|---|---|
| UI-PRT-01 | `/profile`, `/chat` anonymously (2 cases) | redirect to login | P1 |
| UI-PRT-02 | Profile with session | full-name heading + empty state | P1 |
| UI-PRT-03 | Login from a protected page | returned to `/profile` | P2 |
| UI-PRT-04 | Expired stored token | discarded; redirected to login | P2 |
| UI-LST-01 | New post in listing | card with title, pet, owner | P1 |
| UI-LST-02 | Search | narrows; "no match" message | P2 |
| UI-LST-03 | "Only unadopted" filter | adopted card hidden | P2 |
| UI-LST-04 | Open detail from card | title, pet, description | P1 |
| UI-LST-05 | Anonymous *Sahiplen* | button leads to login | P2 |
| UI-LST-06 | Owner on detail | *İlan Size Ait* disabled | P2 |
| UI-LST-07 | Adopt from detail | success toast + *Sahiplenildi* badge; API confirms | P1 |
| UI-LST-08 | Unknown id | *İlan bulunamadı* + back button | P3 |
| UI-LST-09 | Turkish case-insensitive search (`İZMİR`/`izmir`) | match | P3 |
| UI-LST-10 | Cards are links | `href=/ilan/{id}`, Enter opens detail | P3 |
| UI-CRT-01 | Publish with photo | 201, toast, card with uploaded PNG | P1 |
| UI-CRT-02 | Empty title / pet name / description (3 cases) | native validation blocks submit; nothing created | P2 |
| UI-CRT-03 | Missing photo | blocked on the file input | P2 |
| UI-CRT-04 | Cancel dialog | closes, nothing created | P3 |
| UI-CRT-05 | Server rejects the upload | reason shown inside the dialog; form keeps its values | P2 |
| UI-CRT-06 | Delete with confirmation | toast; card removed | P1 |
| UI-CRT-07 | Adopted post on profile | *Sahiplenmeyi iptal et* instead of delete; after cancel, delete is offered | P2 |

---

## 8. Findings (defect log)

All findings were discovered while designing the tests; **all are fixed** and each has a regression test.

| ID | Severity | Finding | Fix | Regression test |
|---|---|---|---|---|
| **F-01** | Low | A register request without `email` threw a `NullReferenceException`, masked as a generic error and not logged. | DataAnnotations on `RegistrationRequestDto`; validation errors use the standard envelope with per-field messages; unexpected errors are logged. | API-REG-06/07/08 |
| **F-02** | Medium | Login response omitted `surname` and `userName`. | `AuthService.Login` maps the full profile. | API-LOG-04 |
| **F-03** | Medium | The post row was saved before the upload was validated → orphan rows. | Validation before saving; save + file write inside a DB transaction (file removed if the transaction fails). | API-CRT-08 |
| **F-04** | **High** | No ownership checks: anyone could create posts for any user, update/delete anyone's post, adopt their own post, cancel anyone's adoption. | Caller id is taken from the JWT; Create/Update/Delete/CancelAdoption require ownership, owners cannot adopt their own post (HTTP 403). | API-CRT-09, API-UPD-03, API-DEL-04, API-ADP-07/08 |
| **F-05** | Low | Business errors returned **HTTP 200**; `UserController` sent `statusCode: 0`. | Every response's HTTP status equals the envelope `statusCode` (201/400/403/404/500); global exception handler returns the envelope. | API-READ-04, API-DEL-03, API-ADP-02/04 |
| **F-06** | Low | Empty result sets were reported as errors. | Empty list with 200. | API-READ-07 |
| **F-07** | Info | `DeletePost` checked `AdoptionRequests`, but nothing ever created one. | `AdoptPost` records an approved, active adoption request (atomic, race-free); `CancelAdoption` deactivates it; an adopted post cannot be deleted until cancelled. UI offers *Sahiplenmeyi iptal et*. | API-DEL-05, API-ADP-09/10, UI-CRT-07 |
| **F-08** | Low (UX) | Register button labelled *Giriş Yap*. | Reads *Kayıt Ol* / *Kayıt yapılıyor...*. | UI-REG-06 |
| **F-09** | Medium | Posts with `null` title could be created and crashed the public listing (`post.title.toLowerCase()`). | API requires all text fields (+ max lengths); listing search is null-safe and Turkish-locale aware. | API-CRT-10/11, UI-LST-09 |

### Other defects fixed during the hardening pass
Found by code review rather than by a failing test; most now have tests anyway.

| Area | Issue | Fix | Test |
|---|---|---|---|
| Security | No brute-force protection on login; distinct messages revealed whether a user exists | Identity lockout (5 attempts / 5 min); one generic message | API-LOG-03/06/07 |
| Security | Upload accepted any content with an image extension; no size limit on create | Magic-byte signature check, 5 MB limit | API-CRT-12/13 |
| Security | Flask AI service ran with `debug=True` on `0.0.0.0` (Werkzeug debugger = remote code execution) and leaked exception text | Debug/host from env (default off / `127.0.0.1`), generic error messages, input length limits | — |
| Concurrency | Two users adopting at the same time could both succeed | Conditional `ExecuteUpdate` inside a transaction | API-ADP-09 |
| Session | Expired JWT kept the UI "logged in" with every call failing; logout left `user` and the Firebase chat session behind | Expiry check at startup, global 401 handler, logout clears both sessions | UI-PRT-04, UI-LOG-05 |
| Data | Timestamps stored as server-local time without zone | Stored as UTC, serialized with `Z` | API-READ-03 |
| UX | Create/edit dialogs closed and lost the input even when the request failed; no feedback on any failure; double-click created duplicates | Dialog closes only on success, error shown inside the dialog, buttons disabled while submitting, toasts for outcomes | UI-CRT-05/06 |
| UX | Stale login error appeared on the register page; login didn't return to the requested page; "back" from detail could leave the site; disabled dead buttons for anonymous users | Fixed | UI-LOG-07, UI-PRT-03, UI-LST-05 |
| UX/a11y | Listing cards were clickable `div`s (no keyboard access) wrapping a nested button; icon-only delete button had no label | Cards are links; labelled buttons | UI-LST-10, UI-CRT-06 |
| UX | AI "generate" sent the pet's name as its breed and failed silently when fields were empty | Sends `type` + `name`; button disabled until both are filled; inline error | — |
| Performance | Single 786 kB JS bundle; listing queries loaded adoption requests that were never returned; change-tracking on read-only queries | Route-level code splitting + vendor chunks (entry chunk 28 kB); lean `AsNoTracking` queries; overlapping chat polls replaced by sequential polling that pauses in hidden tabs | JMeter §10 |
| Logging | Serilog only wrote to Seq, so nothing appeared on the console when Seq was down | Console sink + configurable Seq URL | — |
| Rendering | Coordinates of `0` rendered a stray "0" (`lat && lng &&`) | Explicit `!= null` checks | — |

## 9. Known limitations

* No database reset between runs; local runs accumulate users (posts are cleaned up). Drop `PetStore_Test` and run `npm run db:setup` to start fresh.
* UI suite runs on desktop Chromium only.
* Chat and AI features are not covered by automated tests (see §2).

## 10. Load test (JMeter)

Plan: [`jmeter/GetAllPosts-load-test.jmx`](jmeter/GetAllPosts-load-test.jmx) — see [`jmeter/README.md`](jmeter/README.md). Read-only load on `GET /api/post/GetAllPosts`; run manually, not part of CI.

<!-- JMETER-RESULTS -->
**Run of 2026-11-21** — JMeter 5.6.3 (Java 21), backend in **Release** build on the same Windows 11 machine (loopback), `PetStore_Test` seeded with 52 posts (`node jmeter/seed-posts.mjs seed 50`; response ≈ 34 KB).

| Profile | Users × requests | Samples | Errors | Avg | Median | p90 | p95 | p99 | Max | Throughput |
|---|---|---|---|---|---|---|---|---|---|---|
| Default | 20 × 25 (10 s ramp-up) | 500 | **0 %** | 2.7 ms | 2 ms | 4 ms | 5 ms | 7 ms | 57 ms | 52.8 req/s |
| Stress | 100 × 50 (10 s ramp-up) | 5 000 | **0 %** | 1.8 ms | 2 ms | 2 ms | 3 ms | 4 ms | 34 ms | 505.7 req/s |

All assertions (HTTP 200, `$.isSuccess == true`, < 2 s) passed for every sample. Throughput is bounded by the
load generator's arrival rate (no think time, fixed ramp-up), not by the API — latency stayed flat as load grew 10×.
The read endpoint uses a single `AsNoTracking` query with one `Include`, so there is no N+1 pattern; with a much
larger data set the next step would be server-side pagination (the SPA currently filters client-side).
