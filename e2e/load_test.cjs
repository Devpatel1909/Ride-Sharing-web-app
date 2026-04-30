const http = require('http');
const { performance } = require('perf_hooks');

const URL = process.env.TEST_URL || 'http://localhost:3000/api/rides/1';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const REQUESTS_PER_WORKER = parseInt(process.env.REQUESTS || '2', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);

function makeRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.get(URL, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const ms = performance.now() - start;
        resolve({ status: res.statusCode, time: ms });
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    req.on('error', (err) => {
      const ms = performance.now() - start;
      resolve({
        status: 0,
        time: ms,
        error: err.message,
        code: err.code || 'UNKNOWN'
      });
    });
  });
}

async function worker(id) {
  const results = [];
  for (let i = 0; i < REQUESTS_PER_WORKER; i++) {
    const r = await makeRequest();
    results.push(r);
  }
  return results;
}

(async () => {
  console.log('Running load test:', `${CONCURRENCY} concurrent workers x ${REQUESTS_PER_WORKER} requests -> total ${CONCURRENCY*REQUESTS_PER_WORKER}`);
  const workers = [];
  const startAll = performance.now();
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker(i));
  const all = await Promise.all(workers);
  const flat = all.flat();
  const total = flat.length;
  const avg = flat.reduce((a,b)=>a + (b.time||0),0)/total;
  const sorted = flat.map(r=>r.time).sort((a,b)=>a-b);
  const p95 = sorted[Math.floor(total*0.95)] || 0;
  const errors = flat.filter(r=>r.status !== 200);
  const errorSummary = errors.reduce((acc, result) => {
    const key = result.code || `HTTP_${result.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const duration = (performance.now() - startAll);
  console.log(`Total requests: ${total}, duration: ${duration.toFixed(0)}ms`);
  console.log(`Avg time: ${avg.toFixed(2)}ms, p95: ${p95.toFixed(0)}ms, errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Error summary:', errorSummary);
  }
  console.log('Sample results:', flat.slice(0,10));
  process.exit(0);
})();
