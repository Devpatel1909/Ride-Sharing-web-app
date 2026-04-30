// Debug script to test signup endpoint
const http = require('http');

const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function test() {
  console.log('Testing signup endpoint...\n');

  const signupData = {
    full_name: `Test Passenger ${Date.now()}`,
    email: `passenger-${Date.now()}@test.com`,
    phone: '+919876543210',
    password: 'Test@123'
  };

  console.log('Request:', JSON.stringify(signupData, null, 2));

  const res = await makeRequest('POST', '/auth/signup', signupData);

  console.log('\nResponse Status:', res.status);
  console.log('Response Data:', JSON.stringify(res.data, null, 2));
}

test().catch(console.error);
