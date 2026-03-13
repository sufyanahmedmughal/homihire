const express = require('express');
const router = express.Router();

const {
    verifyUserFirebaseToken,
    verifyWorkerFirebaseToken,
    login,
    loginAdmin,
    getUserProfile,
    getWorkerProfile,
} = require('../controllers/auth.controller');

const { authenticate, authorizeRoles } = require('../middleware/auth');
const { authRateLimiter, otpRateLimiter, sanitizeInput } = require('../middleware/security');

// ─────────────────────────────────────────────────────────────────────
// USER REGISTRATION (Firebase Phone Auth — v3 spec Section 1.4)
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/user/verify-firebase-token
 *
 * Called AFTER client has:
 *   1. Uploaded profile picture to Cloudinary → got URL
 *   2. Called Firebase.auth().signInWithPhoneNumber(phone)
 *   3. User entered OTP → Firebase confirmed → client got firebase_id_token
 *
 * Body (JSON):
 * {
 *   "firebase_id_token": "eyJ...",
 *   "name": "Ahmed Ali",
 *   "phone": "03001234567",
 *   "profile_picture_url": "https://res.cloudinary.com/...",  ← optional
 *   "location": { "lat": 33.6844, "lng": 73.0479 }
 * }
 *
 * Response 201:
 * { "success": true, "token": "eyJ...", "role": "user", "user": { ... } }
 */
router.post('/user/verify-firebase-token', authRateLimiter, sanitizeInput, verifyUserFirebaseToken);

/**
 * GET /api/auth/user/me
 * Header: Authorization: Bearer <token>
 *
 * Returns current user's profile.
 */
router.get('/user/me', authenticate, authorizeRoles('user'), getUserProfile);

// ─────────────────────────────────────────────────────────────────────
// WORKER REGISTRATION (Firebase Phone Auth — v3 spec Section 1.4)
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/worker/verify-firebase-token
 *
 * Called AFTER client has:
 *   1. Uploaded selfie to Cloudinary → got URL
 *   2. Called Firebase.auth().signInWithPhoneNumber(phone)
 *   3. User entered OTP → Firebase confirmed → client got firebase_id_token
 *
 * Body (JSON):
 * {
 *   "firebase_id_token": "eyJ...",
 *   "name": "Usman Khan",
 *   "cnic": "37405-1234567-9",
 *   "phone": "03211234567",
 *   "selfie_url": "https://res.cloudinary.com/...",            ← optional
 *   "skills": ["Plumbing", "Electrical"],
 *   "fee": 1500,
 *   "location": { "lat": 33.69, "lng": 73.05 }
 * }
 *
 * Response 201:
 * { "success": true, "message": "Awaiting admin approval.", "worker": { "_id": "...", "status": "pending" } }
 * NOTE: No JWT — worker must wait for admin approval (Slice 2)
 */
router.post('/worker/verify-firebase-token', authRateLimiter, sanitizeInput, verifyWorkerFirebaseToken);

/**
 * GET /api/auth/worker/me
 * Header: Authorization: Bearer <token>
 *
 * Returns current approved worker's profile.
 */
router.get('/worker/me', authenticate, authorizeRoles('worker'), getWorkerProfile);

// ─────────────────────────────────────────────────────────────────────
// UNIFIED LOGIN — Users and Workers (v3 spec Section 1.6)
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Single endpoint for both users and workers.
 * Backend detects role from DB automatically.
 *
 * Body (JSON):
 * {
 *   "firebase_id_token": "eyJ...",
 *   "phone": "03001234567"
 * }
 *
 * Response 200:
 * { "success": true, "token": "eyJ...", "role": "user"|"worker", "profile": { ... } }
 */
router.post('/login', authRateLimiter, sanitizeInput, login);

// ─────────────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 *
 * Email + password login for admins (seeded manually — no registration).
 *
 * Body (JSON):
 * { "email": "admin@homihire.com", "password": "Admin@123456" }
 *
 * Response 200:
 * { "success": true, "token": "eyJ...", "role": "admin", "admin": { ... } }
 */
router.post('/admin/login', authRateLimiter, sanitizeInput, loginAdmin);

module.exports = router;
