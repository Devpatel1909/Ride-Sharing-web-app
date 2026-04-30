// Automated Testing Script for Shared Ride APIs
// Usage: node test-shared-rides.js

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test data
let testData = {
  passengerToken1: null,
  passengerToken2: null,
  passengerToken3: null,
  riderId: null,
  riderToken: null,
  rideId: null,
  passengerId1: null,
  passengerId2: null,
  passengerId3: null
};

// Helper function to make HTTP requests
const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Test result logger
const logTest = (testName, passed, message = '') => {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} - ${testName}`);
  if (message) console.log(`    ${colors.cyan}→ ${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
};

// Test functions

async function testSignupPassenger1() {
  logSection('1. SIGNUP - Passenger 1');

  const timestamp = Date.now();
  const body = {
    fullName: `Test Passenger 1 ${timestamp}`,
    email: `passenger1-${timestamp}@test.com`,
    phone: '+919876543210',
    password: 'Password@123',
    confirmPassword: 'Password@123'
  };

  const res = await makeRequest('POST', '/auth/signup', body);
  const passed = res.status === 201 && res.data.token;

  logTest('Signup Passenger 1', passed, `Status: ${res.status}`);

  if (passed) {
    testData.passengerToken1 = res.data.token;
    testData.passengerId1 = res.data.user?.id;
  }

  return passed;
}

async function testSignupPassenger2() {
  logSection('2. SIGNUP - Passenger 2');

  const timestamp = Date.now();
  const body = {
    fullName: `Test Passenger 2 ${timestamp}`,
    email: `passenger2-${timestamp}@test.com`,
    phone: '+919876543211',
    password: 'Password@123',
    confirmPassword: 'Password@123'
  };

  const res = await makeRequest('POST', '/auth/signup', body);
  const passed = res.status === 201 && res.data.token;

  logTest('Signup Passenger 2', passed, `Status: ${res.status}`);

  if (passed) {
    testData.passengerToken2 = res.data.token;
    testData.passengerId2 = res.data.user?.id;
  }

  return passed;
}

async function testSignupRider() {
  logSection('3. SIGNUP - Rider');

  const timestamp = Date.now();
  const body = {
    firstName: 'Test',
    lastName: `Rider ${timestamp}`,
    email: `rider-${timestamp}@test.com`,
    phone: '+919999999999',
    password: 'Password@123',
    licenseNumber: 'DL12345',
    vehicle: {
      plate: 'DL01AB1234',
      color: 'Black',
      type: 'car',
      model: 'Toyota Fortuner',
      capacity: 4
    }
  };

  const res = await makeRequest('POST', '/rider/signup', body);
  const passed = res.status === 201 && res.data.token;

  logTest('Signup Rider', passed, `Status: ${res.status}`);

  if (passed) {
    testData.riderToken = res.data.token;
    testData.riderId = res.data.rider?.id;
  }

  return passed;
}

async function testBookSharedRide() {
  logSection('4. BOOK - Create Shared Ride as Passenger 1');

  const body = {
    pickup: 'Connaught Place, Delhi (28.6139, 77.2090)',
    destination: 'Gurugram Station (28.5355, 77.3910)',
    distance: 25.5,
    fare: 450.00,
    rideType: 'shared',
    vehicleType: 'car',
    paymentMethod: 'cash',
    pickupCoordinates: { lat: 28.6139, lng: 77.2090 },
    destinationCoordinates: { lat: 28.5355, lng: 77.3910 }
  };

  const res = await makeRequest('POST', '/rides/book', body, testData.passengerToken1);
  const passed = res.status === 200 && res.data.rideId;

  logTest('Book Shared Ride', passed, `Status: ${res.status}, RideID: ${res.data.rideId}`);

  if (passed) {
    testData.rideId = res.data.rideId;
  }

  return passed;
}

async function testGetSharedAvailableRides() {
  logSection('5. SEARCH - Find Available Shared Rides as Passenger 2');

  const body = {
    pickupLat: 28.6100,
    pickupLng: 77.2050,
    dropoffLat: 28.5350,
    dropoffLng: 77.3900,
    vehicleType: 'car',
    maxDistance: 5
  };

  const res = await makeRequest('POST', '/rides/shared-available', body, testData.passengerToken2);
  const passed = res.status === 200 && res.data.count >= 0;

  logTest(
    'Get Shared Available Rides',
    passed,
    `Status: ${res.status}, Found ${res.data.count} rides`
  );

  if (passed && res.data.count > 0) {
    console.log(`    ${colors.cyan}→ Available rides: ${res.data.rides.map(r => `#${r.rideId}`).join(', ')}${colors.reset}`);
  }

  return passed;
}

async function testJoinSharedRide() {
  logSection('6. JOIN - Passenger 2 Joins Shared Ride');

  if (!testData.rideId) {
    logTest('Join Shared Ride', false, 'No ride created yet');
    return false;
  }

  const body = {
    pickupLocation: 'Nehru Place, Delhi (28.5520, 77.2260)',
    dropoffLocation: 'Sector 15, Gurugram (28.5405, 77.3900)',
    pickupLat: 28.5520,
    pickupLng: 77.2260,
    dropoffLat: 28.5405,
    dropoffLng: 77.3900
  };

  const res = await makeRequest('POST', `/rides/join-shared/${testData.rideId}`, body, testData.passengerToken2);
  const passed = res.status === 200 && res.data.fare && res.data.totalPassengers;

  logTest(
    'Join Shared Ride',
    passed,
    `Status: ${res.status}, Fare: ₹${res.data.fare}, Total: ${res.data.totalPassengers}`
  );

  if (passed) {
    const expectedFare = 450 / 2; // 225
    const fareCorrect = Math.abs(res.data.fare - expectedFare) < 0.01;
    logTest(
      'Fare Splitting (2 passengers)',
      fareCorrect,
      `Fare: ₹${res.data.fare} (Expected: ₹${expectedFare})`
    );
  }

  return passed;
}

async function testGetRidePassengers() {
  logSection('7. PASSENGERS - Get All Passengers in Ride');

  if (!testData.rideId) {
    logTest('Get Ride Passengers', false, 'No ride created yet');
    return false;
  }

  const res = await makeRequest('GET', `/rides/${testData.rideId}/passengers`, null);
  const passed = res.status === 200 && Array.isArray(res.data.passengers);

  logTest(
    'Get Ride Passengers',
    passed,
    `Status: ${res.status}, Count: ${res.data.passengerCount}`
  );

  if (passed) {
    res.data.passengers.forEach((p, i) => {
      console.log(`    ${colors.cyan}→ P${i + 1}: ${p.full_name} (₹${p.fare_amount}, ${p.passenger_status})${colors.reset}`);
    });
  }

  return passed;
}

async function testUpdatePassengerStatus() {
  logSection('8. STATUS - Update Passenger Status (Rider)');

  if (!testData.rideId) {
    logTest('Update Passenger Status', false, 'No ride created yet');
    return false;
  }

  const body = {
    status: 'picked_up'
  };

  const res = await makeRequest(
    'PUT',
    `/rides/${testData.rideId}/passengers/${testData.passengerId1}/status`,
    body,
    testData.riderToken
  );

  const passed = res.status === 200;

  logTest(
    'Update Passenger Status',
    passed,
    `Status: ${res.status}, New Status: ${res.data.passenger?.passenger_status || 'unknown'}`
  );

  return passed;
}

async function testErrorScenarios() {
  logSection('9. ERROR HANDLING - Test Edge Cases');

  // Test 1: Join without authentication
  const res1 = await makeRequest('POST', `/rides/join-shared/${testData.rideId}`, {
    pickupLocation: 'Test (28.5, 77.2)',
    dropoffLocation: 'Test (28.5, 77.4)',
    pickupLat: 28.5,
    pickupLng: 77.2,
    dropoffLat: 28.5,
    dropoffLng: 77.4
  });

  logTest(
    'Join without Auth (should be 401)',
    res1.status === 401,
    `Status: ${res1.status}`
  );

  // Test 2: Join already joined ride
  const res2 = await makeRequest('POST', `/rides/join-shared/${testData.rideId}`, {
    pickupLocation: 'Test (28.5, 77.2)',
    dropoffLocation: 'Test (28.5, 77.4)',
    pickupLat: 28.5,
    pickupLng: 77.2,
    dropoffLat: 28.5,
    dropoffLng: 77.4
  }, testData.passengerToken2);

  logTest(
    'Join Already Joined Ride (should be 400)',
    res2.status === 400,
    `Status: ${res2.status}`
  );

  // Test 3: Join non-existent ride
  const res3 = await makeRequest('POST', `/rides/join-shared/99999`, {
    pickupLocation: 'Test (28.5, 77.2)',
    dropoffLocation: 'Test (28.5, 77.4)',
    pickupLat: 28.5,
    pickupLng: 77.2,
    dropoffLat: 28.5,
    dropoffLng: 77.4
  }, testData.passengerToken1);

  logTest(
    'Join Non-Existent Ride (should be 404)',
    res3.status === 404,
    `Status: ${res3.status}`
  );

  return true;
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.yellow}🧪 SHARED RIDE TESTING SUITE${colors.reset}`);
  console.log(`${colors.yellow}API Base URL: ${BASE_URL}${colors.reset}`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  try {
    // Run all tests in sequence
    const tests = [
      testSignupPassenger1,
      testSignupPassenger2,
      testSignupRider,
      testBookSharedRide,
      testGetSharedAvailableRides,
      testJoinSharedRide,
      testGetRidePassengers,
      testUpdatePassengerStatus,
      testErrorScenarios
    ];

    for (const test of tests) {
      try {
        const passed = await test();
        results.total++;
        if (passed) results.passed++;
        else results.failed++;
      } catch (error) {
        results.total++;
        results.failed++;
        console.error(`  ${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
      }
    }

    // Summary
    logSection('TEST SUMMARY');
    console.log(`${colors.cyan}Total Tests: ${results.total}${colors.reset}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

    if (results.failed === 0) {
      console.log(`\n${colors.green}✨ All tests passed!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Some tests failed. Please check the errors above.${colors.reset}\n`);
    }

    process.exit(results.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Start tests
runTests();
