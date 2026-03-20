const mongoose = require('mongoose');

/**
 * Users Collection — v3 spec Section 3.1
 * Stores registered users. Created ONLY after Firebase Phone Auth verified.
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [100, 'Name must not exceed 100 characters'],
            match: [/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            match: [/^03[0-9]{9}$/, 'Phone must be a valid Pakistani number (e.g. 03001234567)'],
        },
        // Firebase UID — stored to link Firebase identity to our DB record
        firebase_uid: {
            type: String,
            required: true,
            unique: true,
        },
        firebase_phone_verified: {
            type: Boolean,
            default: true, // always true at creation — we create ONLY after Firebase verifies
        },
        profile_picture: {
            type: String, // Cloudinary URL — uploaded by client BEFORE calling this API
            default: null,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [lng, lat] — MongoDB GeoJSON order
                required: [true, 'Location coordinates are required'],
                validate: {
                    validator: function (coords) {
                        return (
                            coords.length === 2 &&
                            coords[0] >= -180 && coords[0] <= 180 && // lng
                            coords[1] >= -90 && coords[1] <= 90     // lat
                        );
                    },
                    message: 'Invalid coordinates',
                },
            },
        },
        status: {
            type: String,
            enum: ['active', 'blocked'],
            default: 'active',
        },
        fcm_token: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Geospatial index for location-based queries (Slice 3+)
userSchema.index({ location: '2dsphere' });
// Note: firebase_uid index is created automatically via `unique: true` on the field — no schema.index() needed

const User = mongoose.model('User', userSchema);
module.exports = User;
