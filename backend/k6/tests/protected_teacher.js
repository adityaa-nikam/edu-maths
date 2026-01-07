import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 2,
  duration: '20s',
};

const BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const CLERK_TOKEN = __ENV.K6_CLERK_TOKEN; // Must be provided for teacher-protected routes

export default function () {
  if (!CLERK_TOKEN) {
    // Skip test if no Clerk token supplied
    return;
  }

  const authHeaders = { headers: { Authorization: `Bearer ${CLERK_TOKEN}`, 'Content-Type': 'application/json' } };

  // Verify token works
  const me = http.get(`${BASE}/api/auth/me`, authHeaders);
  check(me, { '/api/auth/me -> 200': (r) => r.status === 200 });

  // Try creating an academy (slug randomized per VU/ITER to avoid conflicts)
  const slug = `k6-academy-${__VU}-${__ITER}-${Date.now()}`;
  const createBody = JSON.stringify({ name: `K6 Academy ${__VU}`, slug, description: 'Load test academy' });
  const createRes = http.post(`${BASE}/api/academy/create`, createBody, authHeaders);
  check(createRes, { 'POST /api/academy/create -> 201 or 409': (r) => [201,409].includes(r.status) });

  // Try fetching academy exams for teacher (should be accessible when authenticated)
  const listRes = http.get(`${BASE}/api/teacher/academy/exams`, authHeaders);
  check(listRes, { 'GET /api/teacher/academy/exams -> 200 or 404': (r) => [200,404].includes(r.status) });

  sleep(1);
}
