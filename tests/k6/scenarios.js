import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://k8s-kong-kongkong-60cc801a5a-234a19df93b2bffe.elb.ap-northeast-2.amazonaws.com';

export const options = {
  scenarios: {
    // Scenario 1: Job Seeker Flow
    job_seeker: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'jobSeekerFlow',
    },
    // Scenario 2: Recruiter Flow
    recruiter: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m', target: 5 },
        { duration: '30s', target: 0 },
      ],
      exec: 'recruiterFlow',
      startTime: '10s',
    },
    // Scenario 3: AI Matching (burst)
    ai_matching: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
      exec: 'aiMatchingFlow',
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

// Headers with trace context
function getHeaders() {
  const traceId = randomString(32, '0123456789abcdef');
  const spanId = randomString(16, '0123456789abcdef');
  return {
    'Content-Type': 'application/json',
    'traceparent': `00-${traceId}-${spanId}-01`,
    'X-Request-ID': `k6-${traceId.substring(0, 8)}`,
  };
}

// Scenario 1: Job Seeker Flow
// Register → Create Resume → Search Jobs → Apply
export function jobSeekerFlow() {
  const headers = getHeaders();
  const userId = `user_${randomString(8)}`;

  group('Job Seeker - Register', () => {
    const registerPayload = JSON.stringify({
      email: `${userId}@test.com`,
      password: 'test1234',
      name: `Test User ${userId}`,
      role: 'job_seeker',
    });

    const res = http.post(`${BASE_URL}/api/v1/users/register`, registerPayload, { headers });
    check(res, {
      'register status 200/201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(randomIntBetween(1, 2));

  group('Job Seeker - Create Resume', () => {
    const resumePayload = JSON.stringify({
      user_id: userId,
      title: 'Senior Software Engineer',
      summary: 'Experienced developer with 5+ years in cloud-native applications',
      skills: ['Go', 'Python', 'Kubernetes', 'AWS'],
      experience: [
        { company: 'Tech Corp', role: 'Backend Engineer', years: 3 },
      ],
    });

    const res = http.post(`${BASE_URL}/api/v1/resumes`, resumePayload, { headers });
    check(res, {
      'resume create status 200/201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(randomIntBetween(1, 3));

  group('Job Seeker - Search Jobs', () => {
    const res = http.get(`${BASE_URL}/api/v1/jobs?keyword=engineer&limit=10`, { headers });
    check(res, {
      'job search status 200': (r) => r.status === 200,
    });
  });

  sleep(randomIntBetween(1, 2));

  group('Job Seeker - Apply to Job', () => {
    const applyPayload = JSON.stringify({
      user_id: userId,
      job_id: `job_${randomIntBetween(1, 100)}`,
      cover_letter: 'I am very interested in this position...',
    });

    const res = http.post(`${BASE_URL}/api/v1/applications`, applyPayload, { headers });
    check(res, {
      'apply status 200/201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(randomIntBetween(2, 5));
}

// Scenario 2: Recruiter Flow
// Post Job → Search Candidates → View Match Results
export function recruiterFlow() {
  const headers = getHeaders();
  const companyId = `company_${randomString(6)}`;

  group('Recruiter - Post Job', () => {
    const jobPayload = JSON.stringify({
      company_id: companyId,
      title: 'Backend Engineer',
      description: 'Looking for experienced backend developer',
      requirements: ['Go', 'Kubernetes', '3+ years experience'],
      salary_range: { min: 80000, max: 120000 },
      location: 'Seoul, Korea',
    });

    const res = http.post(`${BASE_URL}/api/v1/jobs`, jobPayload, { headers });
    check(res, {
      'job post status 200/201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(randomIntBetween(2, 4));

  group('Recruiter - Search Candidates', () => {
    const res = http.get(`${BASE_URL}/api/v1/resumes?skills=Go,Kubernetes&limit=20`, { headers });
    check(res, {
      'candidate search status 200': (r) => r.status === 200,
    });
  });

  sleep(randomIntBetween(1, 3));

  group('Recruiter - Get Match Results', () => {
    const res = http.get(`${BASE_URL}/api/v1/matches?job_id=job_1&limit=10`, { headers });
    check(res, {
      'match results status 200': (r) => r.status === 200,
    });
  });

  sleep(randomIntBetween(3, 6));
}

// Scenario 3: AI Matching Flow
// Request AI matching for job-resume pairs
export function aiMatchingFlow() {
  const headers = getHeaders();

  group('AI - Match Request', () => {
    const matchPayload = JSON.stringify({
      job_id: `job_${randomIntBetween(1, 50)}`,
      resume_ids: [
        `resume_${randomIntBetween(1, 100)}`,
        `resume_${randomIntBetween(1, 100)}`,
        `resume_${randomIntBetween(1, 100)}`,
      ],
    });

    const res = http.post(`${BASE_URL}/api/v1/matches/calculate`, matchPayload, { headers });
    check(res, {
      'ai match status 200/202': (r) => r.status === 200 || r.status === 202,
    });
  });

  sleep(randomIntBetween(1, 2));
}

// Default function for simple testing
export default function() {
  const headers = getHeaders();

  // Health check
  const res = http.get(`${BASE_URL}/health`, { headers });
  check(res, {
    'health check passed': (r) => r.status === 200,
  });

  sleep(1);
}
