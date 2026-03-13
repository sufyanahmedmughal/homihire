const mongoose = require('mongoose');

/**
 * PhoneVerifications Collection
 * ─────────────────────────────────────────────
 * Temporary record created when Firebase Phone Auth is verified.
 * Prevents DB spam — User/Worker documents only created AFTER phone is verified.
 * Auto-deleted via TTL index after 15 minutes if not cleaned up manually.
 *
 * Section 3.3 of v3 spec.
 */
const phoneVerificationSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        match: [/^03[0-9]{9}$/, 'Invalid Pakistani phone number'],
    },
    role: {
        type: String,
        enum: ['user', 'worker'],
        required: true,
    },
    firebase_uid: {
        type: String,
        required: true,
    },
    expires_at: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
});

// TTL index — MongoDB auto-deletes documents when expires_at passes
// This mirrors: db.phone_verifications.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
phoneVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);
module.exports = PhoneVerification;
