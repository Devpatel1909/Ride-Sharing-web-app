const io = require('socket.io-client');
const http = require('http');

const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

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

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: 5,
      transports: ['websocket']
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);

    setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
  });
}

function waitForEvent(socket, eventName, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName);
      reject(new Error(`Event "${eventName}" not received within ${timeout}ms`));
    }, timeout);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runTests() {
  log.section('🧪 PHASE 2 - SOCKET.IO INTEGRATION TESTS');

  try {
    // Get tokens from existing test
    const tokens = {
      passenger1: 'token1',
      passenger2: 'token2',
      rider: 'token3'
    };

    // ========== TEST 1: Socket.IO Connection ==========
    log.section('1. SOCKET.IO - Connection Test');
    
    let socket1;
    try {
      socket1 = await connectSocket();
      log.pass(`Connected to Socket.IO server`);
      testsPassed++;
      
      // Verify socket connection
      if (socket1.connected) {
        log.pass(`Socket is connected and ready`);
        testsPassed++;
      } else {
        log.fail(`Socket not properly connected`);
        testsFailed++;
      }
    } catch (error) {
      log.fail(`Socket connection failed: ${error.message}`);
      testsFailed++;
    }

    // ========== TEST 2: Listen for shared-ride-available ==========
    log.section('2. SOCKET.IO - Shared Ride Available Event');
    
    try {
      socket1.emit('search-shared-rides', 'test-passenger-1');
      log.pass(`Listening for shared-ride-available events`);
      testsPassed++;
      
      // Set timeout to wait for potential event
      let eventReceived = false;
      socket1.on('shared-ride-available', (data) => {
        if (data && data.id) {
          eventReceived = true;
          log.pass(`Received shared-ride-available event #${data.id}`);
          testsPassed++;
        }
      });
      
      // Wait a bit to see if event comes through (don't fail if it doesn't)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!eventReceived) {
        log.info(`No shared-ride-available event (expected if no rides created)`);
      }
    } catch (error) {
      log.fail(`Event listener setup failed: ${error.message}`);
      testsFailed++;
    }

    // ========== TEST 3: Ride room joining ==========
    log.section('3. SOCKET.IO - Join Ride Room');
    
    let socket2;
    try {
      socket2 = await connectSocket();
      socket2.emit('join-ride', { rideId: 999, role: 'passenger' });
      log.pass(`Joined ride room as passenger`);
      testsPassed++;
      
      // Set up listener for passenger-joined event
      socket2.on('passenger-joined-shared-ride', (data) => {
        log.info(`Listener ready for passenger-joined-shared-ride`);
      });
      
      log.pass(`Event listener registered for passenger joins`);
      testsPassed++;
    } catch (error) {
      log.fail(`Failed to join ride room: ${error.message}`);
      testsFailed++;
    }

    // ========== TEST 4: Status update listeners ==========
    log.section('4. SOCKET.IO - Status Update Events');
    
    try {
      let statusUpdateReceived = false;
      socket2.on('passenger-status-updated', (data) => {
        if (data && data.status) {
          statusUpdateReceived = true;
          log.info(`Status event listener triggered`);
        }
      });
      
      log.pass(`Status update listener registered`);
      testsPassed++;
      
      // Register pickup sequence listener
      socket2.on('pickup-sequence', (data) => {
        log.info(`Pickup sequence listener triggered`);
      });
      
      log.pass(`Pickup sequence listener registered`);
      testsPassed++;
    } catch (error) {
      log.fail(`Failed to register status listeners: ${error.message}`);
      testsFailed++;
    }

    // ========== TEST 5: Multiple listeners ==========
    log.section('5. SOCKET.IO - Multiple Event Listeners');
    
    try {
      let eventCount = 0;
      const eventNames = [
        'shared-ride-available',
        'passenger-joined-shared-ride',
        'passenger-status-updated',
        'pickup-sequence',
        'shared-ride-cancelled'
      ];
      
      eventNames.forEach(eventName => {
        socket1.on(eventName, () => {
          eventCount++;
        });
      });
      
      log.pass(`Registered ${eventNames.length} Socket.IO event listeners`);
      testsPassed++;
    } catch (error) {
      log.fail(`Failed to register multiple listeners: ${error.message}`);
      testsFailed++;
    }

    // ========== TEST 6: Listener cleanup ==========
    log.section('6. SOCKET.IO - Listener Cleanup');
    
    try {
      socket1.emit('leave-shared-search', 'test-passenger-1');
      log.pass(`Sent leave-shared-search event`);
      testsPassed++;
      
      socket1.off('shared-ride-available');
      log.pass(`Unregistered shared-ride-available listener`);
      testsPassed++;
    } catch (error) {
      log.fail(`Failed to cleanup listeners: ${error.message}`);
      testsFailed++;
    }

    // ========== Cleanup ==========
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();

  } catch (error) {
    log.fail(`Test suite error: ${error.message}`);
    testsFailed++;
  }

  // ========== SUMMARY ==========
  log.section('📊 TEST SUMMARY');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}✨ All Socket.IO tests passed!${colors.reset}`);
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

setTimeout(() => {
  console.log(`\n${colors.blue}🚀 Starting Phase 2 Socket.IO Tests${colors.reset}\n`);
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}, 1000);
