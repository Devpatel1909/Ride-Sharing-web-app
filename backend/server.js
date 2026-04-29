const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const { testDatabaseConnection } = require('./db/Connect_to_sql');
require("dotenv").config();

const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
console.log('✅ Socket.IO initialized');

const startServer = async () => {
    try {
        await testDatabaseConnection();
        console.log('✅ Database connection verified');

        server.listen(port, () => {
            console.log(`🚀 Server is running at http://localhost:${port}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`⚡ WebSocket ready for real-time communication`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to database on startup:', error.message);
        process.exit(1);
    }
};

startServer();

server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});