const mongoose = require('mongoose');

/**
 * Jobs Collection — v3 spec Section 3.4
 * Fully implemented in Slice 3.
 * This stub exists in Slice 2 solely so admin blockWorker can set
 * in_progress jobs to 'worker_removed' and getDashboardStats can query counts.
 *
 * DO NOT add job business logic here — Slice 3 will extend this model.
 */
const jobSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'user_id is required'],
        },
        worker_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker',
            default: null,
        },
        category: {
            type: String,
            required: [true, 'category is required'],
            trim: true,
        },
        sub_category: {
            type: String,
            required: [true, 'sub_category is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'description is required'],
            trim: true,
            maxlength: [1000, 'Description must not exceed 1000 characters'],
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: [true, 'Location coordinates are required'],
            },
        },
        location_address: {
            type: String,
            trim: true,
            default: null,
        },
        hire_type: {
            type: String,
            enum: ['direct', 'quote'],
            required: [true, 'hire_type is required'],
        },
        status: {
            type: String,
            enum: [
                'pending',
                'in_progress',
                'completed',
                'cancelled',
                'worker_removed', // Set by admin when blocking worker — Slice 2
            ],
            default: 'pending',
        },
        agreed_fee: {
            type: Number,
            default: null,
        },
        estimated_duration: {
            type: Number, // minutes
            default: null,
        },
        distance_km: {
            type: Number,
            default: null,
        },
        started_at: {
            type: Date,
            default: null,
        },
        completed_at: {
            type: Date,
            default: null,
        },
        cancelled_at: {
            type: Date,
            default: null,
        },
        // Set when admin blocks a worker mid-job — Slice 2
        worker_removed_at: {
            type: Date,
            default: null,
        },
        worker_removed_reason: {
            type: String,
            default: null,
        },
        payment_done: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes — v3 spec Section 3.12
jobSchema.index({ user_id: 1, status: 1 });
jobSchema.index({ worker_id: 1, status: 1 });
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
