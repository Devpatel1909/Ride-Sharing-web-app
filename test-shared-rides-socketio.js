const http = require('http');
const io = require('socket.io-client');

const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✓ PASS${colors.reset} - ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗ FAIL${colors.reset} - ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} - ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
};

let testsPassed = 0;
let testsFailed = 0;
let tokens = {};

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Connect Socket.IO client and wait for event
 */
function connectSocket(token = null) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: 5,
      transports: ['websocket']
    });

    socket.on('connect', () => {
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      reject(error);
    });

    setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, 5000);
  });
}

/**
 * Wait for a Socket.IO event with timeout
 */
function waitForEvent(socket, eventName, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event "${eventName}" not received within ${timeout}ms`));
    }, timeout);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runTests() {
  log.section('🧪 SHARED RIDE SOCKET.IO TESTING SUITE');

  try {
    // ==================== SETUP ====================
    log.section('1. SETUP - Create test users and get auth tokens');

    // Signup Passenger 1
    const pass1Res = await makeRequest('POST', '/auth/signup', {
      fullName: `Test Passenger 1 ${Date.now()}`,
      email: `passenger1-${Date.now()}@test.com`,
      password: 'TestPass123!',
      userType: 'passenger'
    });

    if (pass1Res.status !== 201) {
      log.fail(`Signup Passenger 1 - Status: ${pass1Res.status}`);
      testsFailed++;
    } else {
      tokens.passenger1 = pass1Res.data.token;
      log.pass(`Signup Passenger 1`);
      testsPassed++;
    }

    // Signup Passenger 2
    const pass2Res = await makeRequest('POST', '/auth/signup', {
      fullName: `Test Passenger 2 ${Date.now()}`,
      email: `passenger2-${Date.now()}@test.com`,
      password: 'TestPass123!',
      userType: 'passenger'
    });

    if (pass2Res.status !== 201) {
      log.fail(`Signup Passenger 2 - Status: ${pass2Res.status}`);
      testsFailed++;
    } else {
      tokens.passenger2 = pass2Res.data.token;
      log.pass(`Signup Passenger 2`);
      testsPassed++;
    }

    // Signup Rider
    const riderRes = await makeRequest('POST', '/auth/signup-rider', {
      firstName: `Rider ${Date.now()}`,
      lastName: 'Test',
      email: `rider-${Date.now()}@test.com`,
      password: 'TestPass123!',
      vehicleType: 'car',
      vehicleModel: 'Toyota Innova',
      vehiclePlate: `DL01AB${Math.floor(Math.random() * 1000)}`
    });

    if (riderRes.status !== 201) {
      log.fail(`Signup Rider - Status: ${riderRes.status}`);
      testsFailed++;
    } else {
      tokens.rider = riderRes.data.token;
      log.pass(`Signup Rider`);
      testsPassed++;
    }

    // ==================== SOCKET.IO BROADCAST TEST ====================
    log.section('2. SOCKET.IO - Test shared-ride-available event');

    let socket1, eventData;
    try {
      // Connect socket and listen for shared-ride-available
      socket1 = await connectSocket();
      socket1.emit('search-shared-rides', 'passenger-2-id');
      log.pass(`Connected Socket and listening for shared-ride-available`);
      testsPassed++;

      // Create shared ride (should broadcast event)
      const bookRes = await makeRequest('POST', '/rides/book', {
        pickup: 'Delhi, India (28.7041, 77.1025)',
        destination: 'Gurugram, India (28.4595, 77.0266)',
        distance: 25.5,
        fare: 450,
        rideType: 'shared',
        vehicleType: 'car',
        paymentMethod: 'cash',
        pickupCoordinates: { lat: 28.7041, lng: 77.1025 }
      }, tokens.passenger1);

      if (bookRes.status !== 200) {
        log.fail(`Book Shared Ride - Status: ${bookRes.status}`);
        testsFailed++;
      } else {
        const rideId = bookRes.data.rideId;
        log.pass(`Booked Shared Ride #${rideId}`);
        testsPassed++;

        // Wait for shared-ride-available event
        try {
          eventData = await waitForEvent(socket1, 'shared-ride-available', 2000);
          
          if (eventData && eventData.id === rideId && eventData.id !== undefined) {
            log.pass(`Received shared-ride-available event for ride #${rideId}`);
            testsPassed++;
          } else {
            log.fail(`shared-ride-available event data mismatch`);
            testsFailed++;
          }
        } catch (error) {
          log.fail(`Did not receive shared-ride-available event: ${error.message}`);
          testsFailed++;
        }
      }
    } catch (error) {
      log.fail(`Socket.IO broadcast test error: ${error.message}`);
      testsFailed++;
    } finally {
      if (socket1) socket1.disconnect();
    }

    // ==================== PASSENGER JOIN EVENT TEST ====================
    log.section('3. SOCKET.IO - Test passenger-joined-shared-ride event');

    try {
      const bookRes = await makeRequest('POST', '/rides/book', {
        pickup: 'Delhi, India (28.7041, 77.1025)',
        destination: 'Noida, India (28.5921, 77.2064)',
        distance: 20,
        fare: 400,
        rideType: 'shared',
        vehicleType: 'car',
        paymentMethod: 'cash',
        pickupCoordinates: { lat: 28.7041, lng: 77.1025 }
      }, tokens.passenger1);

      if (bookRes.status !== 200) {
        log.fail(`Book Shared Ride for join test - Status: ${bookRes.status}`);
        testsFailed++;
        return;
      }

      const rideId = bookRes.data.rideId;
      log.info(`Created ride #${rideId} for join test`);

      // Connect socket to listen for passenger join
      const socket2 = await connectSocket();
      socket2.emit('join-ride', { rideId, role: 'passenger' });

      const joinRes = await makeRequest('POST', `/rides/join-shared/${rideId}`, {
        pickupLocation: 'Delhi, India (28.7041, 77.1025)',
        dropoffLocation: 'Noida, India (28.5921, 77.2064)',
        pickupLat: 28.7041,
        pickupLng: 77.1025,
        dropoffLat: 28.5921,
        dropoffLng: 77.2064
      }, tokens.passenger2);

      if (joinRes.status !== 200) {
        log.fail(`Join Shared Ride - Status: ${joinRes.status}`);
        testsFailed++;
        socket2.disconnect();
        return;
      }

      log.pass(`Passenger 2 joined ride #${rideId}`);
      testsPassed++;

      // Wait for passenger-joined-shared-ride event
      try {
        const joinEventData = await waitForEvent(socket2, 'passenger-joined-shared-ride', 2000);
        
        if (joinEventData && joinEventData.rideId === rideId && joinEventData.passenger) {
          log.pass(`Received passenger-joined-shared-ride event`);
          log.info(`  → Total passengers: ${joinEventData.totalPassengers}`);
          log.info(`  → New fare per passenger: ₹${joinEventData.newFare}`);
          testsPassed++;
        } else {
          log.fail(`passenger-joined-shared-ride event data incomplete`);
          testsFailed++;
        }
      } catch (error) {
        log.fail(`Did not receive passenger-joined-shared-ride event: ${error.message}`);
        testsFailed++;
      }

      socket2.disconnect();
    } catch (error) {
      log.fail(`Passenger join event test error: ${error.message}`);
      testsFailed++;
    }

    // ==================== STATUS UPDATE EVENT TEST ====================
    log.section('4. SOCKET.IO - Test passenger-status-updated event');

    try {
      const bookRes = await makeRequest('POST', '/rides/book', {
        pickup: 'Bangalore, India (12.9716, 77.5946)',
        destination: 'Whitefield, India (12.9698, 77.7499)',
        distance: 8,
        fare: 300,
        rideType: 'shared',
        vehicleType: 'car',
        paymentMethod: 'cash',
        pickupCoordinates: { lat: 12.9716, lng: 77.5946 }
      }, tokens.passenger1);

      if (bookRes.status !== 200) {
        log.fail(`Book Shared Ride for status test - Status: ${bookRes.status}`);
        testsFailed++;
        return;
      }

      const rideId = bookRes.data.rideId;

      // Join as passenger 2
      const joinRes = await makeRequest('POST', `/rides/join-shared/${rideId}`, {
        pickupLocation: 'Bangalore, India (12.9716, 77.5946)',
        dropoffLocation: 'Whitefield, India (12.9698, 77.7499)',
        pickupLat: 12.9716,
        pickupLng: 77.5946,
        dropoffLat: 12.9698,
        dropoffLng: 77.7499
      }, tokens.passenger2);

      if (joinRes.status !== 200) {
        log.fail(`Join for status test - Status: ${joinRes.status}`);
        testsFailed++;
        return;
      }

      // Get passenger ID to update
      const passengersRes = await makeRequest('GET', `/rides/${rideId}/passengers`, null, tokens.passenger1);
      if (passengersRes.status !== 200 || !passengersRes.data.passengers.length) {
        log.fail(`Get passengers - Status: ${passengersRes.status}`);
        testsFailed++;
        return;
      }

      const passenger2Id = passengersRes.data.passengers[1].passenger_id;
      
      // Connect socket to listen for status update
      const socket3 = await connectSocket();
      socket3.emit('join-ride', { rideId, role: 'rider' });

      // Update passenger status
      const statusRes = await makeRequest('PUT', `/rides/${rideId}/passengers/${passenger2Id}/status`, 
        { status: 'picked_up' }, 
        tokens.rider
      );

      if (statusRes.status !== 200) {
        log.fail(`Update passenger status - Status: ${statusRes.status}`);
        testsFailed++;
        socket3.disconnect();
        return;
      }

      log.pass(`Updated passenger ${passenger2Id} status to picked_up`);
      testsPassed++;

      // Wait for passenger-status-updated event
      try {
        const statusEventData = await waitForEvent(socket3, 'passenger-status-updated', 2000);
        
        if (statusEventData && statusEventData.status === 'picked_up') {
          log.pass(`Received passenger-status-updated event`);
          log.info(`  → Passenger: ${statusEventData.passengerName}`);
          log.info(`  → New Status: ${statusEventData.status}`);
          testsPassed++;
        } else {
          log.fail(`passenger-status-updated event status mismatch`);
          testsFailed++;
        }
      } catch (error) {
        log.fail(`Did not receive passenger-status-updated event: ${error.message}`);
        testsFailed++;
      }

      socket3.disconnect();
    } catch (error) {
      log.fail(`Status update event test error: ${error.message}`);
      testsFailed++;
    }

    // ==================== PICKUP SEQUENCE TEST ====================
    log.section('5. SOCKET.IO - Test pickup-sequence event');

    try {
      const bookRes = await makeRequest('POST', '/rides/book', {
        pickup: 'Mumbai, India (19.0760, 72.8777)',
        destination: 'Pune, India (18.5204, 73.8567)',
        distance: 150,
        fare: 1200,
        rideType: 'shared',
        vehicleType: 'car',
        paymentMethod: 'cash',
        pickupCoordinates: { lat: 19.0760, lng: 72.8777 }
      }, tokens.passenger1);

      if (bookRes.status !== 200) {
        log.fail(`Book for pickup sequence test - Status: ${bookRes.status}`);
        testsFailed++;
        return;
      }

      const rideId = bookRes.data.rideId;

      // Join with passenger 2
      await makeRequest('POST', `/rides/join-shared/${rideId}`, {
        pickupLocation: 'Mumbai, India (19.0760, 72.8777)',
        dropoffLocation: 'Pune, India (18.5204, 73.8567)',
        pickupLat: 19.0760,
        pickupLng: 72.8777,
        dropoffLat: 18.5204,
        dropoffLng: 73.8567
      }, tokens.passenger2);

      // Get passenger ID
      const passengersRes = await makeRequest('GET', `/rides/${rideId}/passengers`, null, tokens.passenger1);
      const passenger2Id = passengersRes.data.passengers[1].passenger_id;

      // Connect socket
      const socket4 = await connectSocket();
      socket4.emit('join-ride', { rideId, role: 'rider' });

      // Update first passenger to accepted to trigger pickup sequence
      await makeRequest('PUT', `/rides/${rideId}/passengers/${passengersRes.data.passengers[0].passenger_id}/status`, 
        { status: 'accepted' }, 
        tokens.rider
      );

      try {
        const pickupData = await waitForEvent(socket4, 'pickup-sequence', 2000);
        
        if (pickupData && pickupData.passengers && pickupData.passengers.length > 0) {
          log.pass(`Received pickup-sequence event`);
          log.info(`  → Total passengers in sequence: ${pickupData.passengers.length}`);
          pickupData.passengers.forEach((p, i) => {
            log.info(`     ${i + 1}. ${p.passengerName} - ${p.status}`);
          });
          testsPassed++;
        } else {
          log.fail(`pickup-sequence event data incomplete`);
          testsFailed++;
        }
      } catch (error) {
        log.fail(`Did not receive pickup-sequence event: ${error.message}`);
        testsFailed++;
      }

      socket4.disconnect();
    } catch (error) {
      log.fail(`Pickup sequence test error: ${error.message}`);
      testsFailed++;
    }

  } catch (error) {
    log.fail(`Test suite error: ${error.message}`);
    testsFailed++;
  }

  // ==================== SUMMARY ====================
  log.section('📊 TEST SUMMARY');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}✨ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

// Wait for backend to be ready
setTimeout(() => {
  console.log(`\n${colors.blue}🚀 Starting Phase 2 Socket.IO Test Suite${colors.reset}\n`);
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}, 1000);
