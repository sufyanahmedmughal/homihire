const mongoose = require('mongoose');

// Master skills list — Section 2 of v3 spec
const VALID_SKILLS = [
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Building / Construction',
    'Repairing / Maintenance',
];

/**
 * Workers Collection — v3 spec Section 3.2
 * Created ONLY after Firebase Phone Auth verified.
 * Status stays 'pending' until admin approves.
 */
const workerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [100, 'Name must not exceed 100 characters'],
            match: [/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'],
        },
        cnic: {
            type: String,
            required: [true, 'CNIC is required'],
            unique: true,
            match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'CNIC must be in format: XXXXX-XXXXXXX-X'],
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
            default: true, // always true at creation
        },
        selfie_url: {
            type: String, // Cloudinary URL — uploaded by client BEFORE calling this API
            default: null,
        },
        skills: {
            type: [String],
            required: [true, 'At least one skill is required'],
            validate: {
                validator: function (skillsArr) {
                    return (
                        skillsArr.length >= 1 &&
                        skillsArr.every((s) => VALID_SKILLS.includes(s))
                    );
                },
                message: 'Skills must be valid main categories from the master list',
            },
        },
        fee: {
            type: Number,
            required: [true, 'Service fee is required'],
            min: [100, 'Fee must be at least 100 PKR'],     // v3 changed min from 1 → 100
            max: [999999, 'Fee cannot exceed 999,999 PKR'],
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
            enum: ['pending', 'approved', 'rejected', 'blocked'],
            default: 'pending',
        },
        rejection_reason: {
            type: String,
            default: null,
            maxlength: [500, 'Rejection reason too long'],
        },
        is_available: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        // For atomic rating calculation (Slice 6)
        rating_sum: {
            type: Number,
            default: 0,
        },
        total_ratings: {
            type: Number,
            default: 0,
        },
        total_jobs: {
            type: Number,
            default: 0,
        },
        fcm_token: {
            type: String,
            default: null,
        },
        admin_note: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes — compound for geospatial + status filter (Slice 3)
workerSchema.index({ location: '2dsphere' });
workerSchema.index({ status: 1, is_available: 1, location: '2dsphere' });
workerSchema.index({ firebase_uid: 1 });

const Worker = mongoose.model('Worker', workerSchema);

module.exports = { Worker, VALID_SKILLS };
