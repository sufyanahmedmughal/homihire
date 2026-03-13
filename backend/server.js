require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectCloudinary } = require('./src/config/cloudinary');
const { initializeFirebase } = require('./src/config/firebase');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Configure Cloudinary
        connectCloudinary();

        // 3. Initialize Firebase Admin
        initializeFirebase();

        // 4. Start Express server
        app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════╗');
            console.log('║         HomiHire Backend API           ║');
            console.log('║         Slice 1 — Authentication       ║');
            console.log('╠════════════════════════════════════════╣');
            console.log(`║  Server  : http://localhost:${PORT}       ║`);
            console.log(`║  Health  : http://localhost:${PORT}/health ║`);
            console.log(`║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(28)}  ║`);
            console.log('╚════════════════════════════════════════╝');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

// Handle uncaught errors gracefully
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});

startServer();
