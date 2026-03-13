const admin = require('firebase-admin');

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 3;

/**
 * ─────────────────────────────────────────────────────────────────
 * FIREBASE PHONE AUTH FLOW (Production)
 * ─────────────────────────────────────────────────────────────────
 * How it works:
 *
 * 1. Client (React Native) calls firebase.auth().signInWithPhoneNumber('+92XXXXXXXXXX')
 *    → Firebase sends a real SMS OTP to the phone number
 *
 * 2. User enters OTP in the app
 *
 * 3. Client calls confirmationResult.confirm(otp)
 *    → Firebase verifies the OTP and returns a Firebase User + ID Token
 *
 * 4. Client sends the Firebase ID Token to our backend:
 *    POST /api/auth/user/verify-otp  { user_id, firebase_id_token }
 *
 * 5. Backend calls verifyFirebaseToken(firebase_id_token) — this function
 *    → Checks the token signature with Firebase Admin SDK
 *    → Returns decoded token with { phone_number, uid, ... }
 *
 * 6. Backend confirms decoded phone_number matches the registered phone
 *    → Activates the user / issues JWT
 *
 * Phone number format sent by Firebase: +923001234567 (E.164 format)
 * Our DB stores:                        03001234567   (Pakistani local format)
 * Conversion: strip leading +92, add 0 → +923001234567 → 03001234567
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Verify a Firebase ID Token received from the client app.
 * @param {string} idToken - Firebase ID Token from client
 * @returns {object} decoded - { uid, phone_number, ... }
 * @throws error if token is invalid/expired
 */
const verifyFirebaseToken = async (idToken) => {
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        return decoded;
    } catch (error) {
        // Map Firebase errors to user-friendly messages
        if (error.code === 'auth/id-token-expired') {
            throw new Error('OTP verification session expired. Please try again.');
        }
        if (error.code === 'auth/id-token-revoked') {
            throw new Error('OTP verification token was revoked. Please try again.');
        }
        if (
            error.code === 'auth/argument-error' ||
            error.code === 'auth/invalid-id-token'
        ) {
            throw new Error('Invalid OTP verification token. Please try again.');
        }
        throw new Error('OTP verification failed. Please try again.');
    }
};

/**
 * Convert Firebase E.164 phone format to Pakistani local format.
 * Firebase returns: +923001234567
 * Our DB stores:    03001234567
 *
 * @param {string} firebasePhone - e.g. "+923001234567"
 * @returns {string} - e.g. "03001234567"
 */
const convertFirebasePhoneToPakistani = (firebasePhone) => {
    if (!firebasePhone) return null;
    // Remove +92 prefix and add 0
    const cleaned = firebasePhone.replace(/\s+/g, '').trim();
    if (cleaned.startsWith('+92')) {
        return '0' + cleaned.slice(3); // +923001234567 → 03001234567
    }
    if (cleaned.startsWith('92')) {
        return '0' + cleaned.slice(2); // 923001234567 → 03001234567
    }
    return cleaned; // Already in local format
};

/**
 * Convert Pakistani local phone to E.164 format for Firebase.
 * Our DB:          03001234567
 * Firebase needs:  +923001234567
 *
 * @param {string} localPhone - e.g. "03001234567"
 * @returns {string} - e.g. "+923001234567"
 */
const convertToFirebasePhone = (localPhone) => {
    if (!localPhone) return null;
    const cleaned = localPhone.replace(/\s+/g, '').trim();
    if (cleaned.startsWith('0')) {
        return '+92' + cleaned.slice(1); // 03001234567 → +923001234567
    }
    return cleaned;
};

module.exports = {
    verifyFirebaseToken,
    convertFirebasePhoneToPakistani,
    convertToFirebasePhone,
    OTP_EXPIRY_MINUTES,
    OTP_RESEND_COOLDOWN_SECONDS,
    MAX_OTP_ATTEMPTS,
};
