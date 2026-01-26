import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

const BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const ACADEMY_SLUG = __ENV.ACADEMY_SLUG || 'my-abacus-academy';

export default function () {
  const res1 = http.get(`${BASE}/api/academy/${ACADEMY_SLUG}`);
  check(res1, { 'GET /api/academy/:slug is 200': (r) => r.status === 200 });

  const res2 = http.get(`${BASE}/api/exams/academy/${ACADEMY_SLUG}`);
  check(res2, { 'GET /api/exams/academy/:slug is 200': (r) => r.status === 200 });

  sleep(1);
}
