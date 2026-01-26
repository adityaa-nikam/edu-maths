K6 test scaffold for edu-maths backend

Overview
- Small set of k6 scripts to smoke-test public endpoints and run an authenticated student flow.

Files
- `tests/public_endpoints.js` — smoke test for public endpoints (`/api/academy/:slug`, `/api/exams/academy/:slug`).
- `tests/auth_flow.js` — example authenticated student flow (login → check status → start attempt). Requires test student credentials or a JWT.
- `.env.example` — example environment variables used by the scripts.

Quick setup (Windows PowerShell)
```powershell
# Install k6 (one-time)
choco install k6

# From project root run a smoke test
cd backend/k6
# public endpoints
k6 run tests/public_endpoints.js --env K6_BASE_URL=http://localhost:8080 --env ACADEMY_SLUG=my-abacus-academy

# authenticated flow (requires test student or JWT)
k6 run tests/auth_flow.js --env K6_BASE_URL=http://localhost:8080 --env ACADEMY_SLUG=my-abacus-academy --env STUDENT_USERNAME=student1 --env STUDENT_PASSWORD=secret --env EXAM_ID=<exam-id>
```

Run with Docker (from repo root)
```powershell
docker run --rm -v ${PWD}/backend/k6:/src -w /src loadimpact/k6 run tests/public_endpoints.js --env K6_BASE_URL=http://host.docker.internal:8080
--env ACADEMY_SLUG=my-abacus-academy
```

Environment variables
- `K6_BASE_URL` — base URL of the running backend (default `http://localhost:8080`).
- `ACADEMY_SLUG` — slug used by public endpoints.
- `STUDENT_USERNAME`, `STUDENT_PASSWORD`, `EXAM_ID` — used by `auth_flow.js` when testing student flows.
- `K6_STUDENT_JWT` / `K6_CLERK_TOKEN` — optional: if you already have valid tokens, export them and modify `auth_flow.js` to use them.

Notes
- Adjust `options` in each script to change VUs and duration for load testing.
- Authenticated tests require a test student or valid tokens; do not use production credentials.
- Use `--summary-export=summary.json` to save k6 summary output for later inspection.

Protected (Clerk) routes
- Teacher endpoints use Clerk JWTs (Bearer token) and cannot be obtained via `POST /api/students/login`.
- Provide a Clerk token to k6 using `--env K6_CLERK_TOKEN=eyJ...` or export it in your shell before running.

How to get a Clerk token for testing
- Option A (recommended): Use a test teacher account in your frontend to sign in via Clerk and copy the session JWT shown in your app's network requests (Authorization header). Use that token for the k6 run.
- Option B: Use Clerk's admin APIs or SDK to mint a session/token for automated tests (see Clerk docs for "Create session" / service tokens). Put the resulting JWT in `K6_CLERK_TOKEN`.
- Option C (dev-only): Add a dev bypass in your backend (not recommended for CI). For local testing you can add an environment flag that makes the auth middleware accept a static token.

Example run (teacher-protected)
```powershell
# supply token on the command line
k6 run tests/protected_teacher.js --env K6_BASE_URL=http://localhost:3000 --env K6_CLERK_TOKEN=eyJ...your_token_here

# or load from .env (PowerShell example)
$env:K6_CLERK_TOKEN='eyJ...'
k6 run tests/protected_teacher.js --env K6_BASE_URL=http://localhost:3000
```

Security notes
- Never commit real tokens to source. Use CI secrets for automated runs.
- Rotate tokens regularly for safety.
