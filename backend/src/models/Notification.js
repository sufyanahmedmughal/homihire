const mongoose = require('mongoose');

/**
 * Notifications Collection — v3 spec Section 3.9
 * Stores push notification records for users and workers.
 * Inserted on: approval / rejection / blocking / job status changes
 */
const notificationSchema = new mongoose.Schema(
    {
        // Recipient — either a user_id OR worker_id (not both)
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        worker_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker',
            default: null,
        },

        // Notification content
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
            maxlength: [200, 'Title too long'],
        },
        body: {
            type: String,
            required: [true, 'Notification body is required'],
            trim: true,
            maxlength: [1000, 'Body too long'],
        },

        // Notification type — for client-side routing
        type: {
            type: String,
            enum: [
                'worker_approved',
                'worker_rejected',
                'worker_blocked',
                'user_blocked',
                'job_posted',
                'job_accepted',
                'job_completed',
                'job_cancelled',
                'job_worker_removed',
                'quote_submitted',
                'quote_accepted',
                'quote_rejected',
                'payment_received',
                'feedback_received',
                'complaint_update',
                'general',
            ],
            default: 'general',
        },

        // Optional extra data — free-form JSON payload for the client
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        // Push delivery tracking
        is_sent: {
            type: Boolean,
            default: false,
        },
        sent_at: {
            type: Date,
            default: null,
        },

        // Read status — for in-app notification centre
        is_read: {
            type: Boolean,
            default: false,
        },
        read_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes — v3 spec Section 3.12
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ worker_id: 1, created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
