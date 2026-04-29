const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const pool = require('./db/Connect_to_sql');
require("dotenv").config();

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        // Fail fast if database is unreachable.
        await pool.query('SELECT 1');
        console.log('✅ Database connection verified');

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.IO
        initializeSocket(server);
        console.log('✅ Socket.IO initialized');

        server.listen(port, () => {
            console.log(`🚀 Server is running at http://localhost:${port}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`⚡ WebSocket ready for real-time communication`);
        });

        server.on('error', (err) => {
            console.error('Server error:', err);
            process.exit(1);
        });
    } catch (err) {
        console.error('❌ Database connection failed during startup:', err.message);
        process.exit(1);
    }
}

startServer();

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});