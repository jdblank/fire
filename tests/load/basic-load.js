import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.1'],              // Custom error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test home page
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'home page status is 200': (r) => r.status === 200,
    'home page has content': (r) => r.body.includes('Fire Platform'),
  }) || errorRate.add(1);

  sleep(1);

  // Test health endpoint
  res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check returns ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok';
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'test-results/load-test-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, { indent = '', enableColors = false } = {}) {
  const colors = enableColors
    ? {
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        reset: '\x1b[0m',
      }
    : { green: '', red: '', yellow: '', reset: '' };

  let summary = `\n${indent}Load Test Summary:\n`;
  summary += `${indent}  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}  Success Rate: ${colors.green}${(
    (1 - data.metrics.http_req_failed.values.rate) *
    100
  ).toFixed(2)}%${colors.reset}\n`;
  summary += `${indent}  Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(
    2
  )}ms\n`;
  summary += `${indent}  P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(
    2
  )}ms\n`;

  return summary;
}


