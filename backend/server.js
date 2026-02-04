const http=require('http');
const app=require('./app');
const port=process.env.PORT || 3000;

const server=http.createServer(app);

server.listen(port,()=>{
    console.log(`Server is running at ${port}`);
});

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