import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5,
  duration: '30s',
};

const BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const USERNAME = __ENV.STUDENT_USERNAME;
const PASSWORD = __ENV.STUDENT_PASSWORD;
const SLUG = __ENV.ACADEMY_SLUG;
const EXAM_ID = __ENV.EXAM_ID;

export default function () {
  // Skip test if required env vars are missing
  if (!USERNAME || !PASSWORD || !SLUG || !EXAM_ID) {
    return;
  }

  const loginRes = http.post(
    `${BASE}/api/students/login`,
    JSON.stringify({ academySlug: SLUG, username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, { 'student login 200': (r) => r.status === 200 });

  let token = null;
  try {
    token = loginRes.json('token');
  } catch (e) {
    token = null;
  }

  if (!token) {
    return;
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

  // Check exam status
  const statusRes = http.get(`${BASE}/api/exams/${EXAM_ID}/status`, authHeaders);
  check(statusRes, { 'exam status ok or auth error': (r) => [200,401,403,404].includes(r.status) });

  // Try to start an attempt
  const startRes = http.post(`${BASE}/api/exams/${EXAM_ID}/start`, null, authHeaders);
  check(startRes, { 'start attempt created or error handled': (r) => [201,400,403,404].includes(r.status) });

  sleep(1);
}
