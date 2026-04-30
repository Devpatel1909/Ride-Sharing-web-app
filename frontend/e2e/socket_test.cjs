const io = require('socket.io-client');

const url = process.env.E2E_SOCKET_URL || 'http://localhost:3000';
console.log('Attempting Socket.IO connect to', url);

const socket = io(url, {
  transports: ['websocket', 'polling'],
  reconnection: false,
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket connect_error:', err.message || err);
  process.exit(2);
});

socket.on('connect_timeout', () => {
  console.error('❌ Socket connect timeout');
  process.exit(3);
});
