const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const {
    securityHeaders,
    globalRateLimiter,
    sanitizeInput,
    productionErrorHandler,
    notFoundHandler,
} = require('./middleware/security');

// Route imports
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes'); // Slice 2

const app = express();

// ─────────────────────────────────────────────
// TRUST PROXY — required when behind ngrok/Railway/any reverse proxy
// Needed so express-rate-limit reads the real IP from X-Forwarded-For
// without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// ─────────────────────────────────────────────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// SECURITY HEADERS — must be first
// ─────────────────────────────────────────────
app.use(securityHeaders);

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const corsOptions = {
    origin: (origin, callback) => {
        // Allow all origins — works for localhost dev, ngrok, and LAN IPs
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    optionsSuccessStatus: 204, // Some browsers choke on 200 for OPTIONS
};

app.use(cors(corsOptions));

// ─────────────────────────────────────────────
// PREFLIGHT — OPTIONS must respond BEFORE rate limiters
// ─────────────────────────────────────────────
app.options(/.*/, cors(corsOptions));

// ─────────────────────────────────────────────
// GLOBAL RATE LIMITER — runs AFTER preflight is handled
// ─────────────────────────────────────────────
app.use(globalRateLimiter);

// ─────────────────────────────────────────────
// BODY PARSERS
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // 10mb to allow base64 images in body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────
// LOGGING — skip in test environment
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HomiHire API is running',
        version: '2.0.0',
        slice: 'Slice 2 — Admin Dashboard & Worker Approval',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);       // Slice 1 — Auth & Registration
app.use('/api/admin', adminRoutes);     // Slice 2 — Admin Dashboard & Worker Approval

// Future slices will add routes here:
// app.use('/api/jobs', jobRoutes);       // Slice 3
// app.use('/api/workers', workerRoutes); // Slice 4
// app.use('/api/payments', payRoutes);   // Slice 6
// app.use('/api/complaints', ...);       // Slice 7

// ─────────────────────────────────────────────
// 404 & ERROR HANDLERS — must be last
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(productionErrorHandler);

module.exports = app;
