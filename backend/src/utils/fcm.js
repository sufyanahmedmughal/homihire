const admin = require('firebase-admin');
const Notification = require('../models/Notification');

/**
 * ─────────────────────────────────────────────────────────────────────
 * FCM Push Notification Utility — v3 spec Section 2.1
 * Uses Firebase Admin SDK (already initialised in config/firebase.js)
 *
 * sendPushNotification(options)
 *   options.fcm_token  — recipient device FCM token (string)
 *   options.title      — notification title
 *   options.body       — notification body
 *   options.data       — extra key-value payload (object, all values must be strings)
 *
 * createAndSendNotification(options)
 *   Persists to Notifications collection AND sends push if fcm_token exists.
 *   Caller should fire-and-forget — errors are caught internally.
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * Send a raw FCM push notification to a single device token.
 * @returns {string|null} FCM message ID on success, null on failure
 */
const sendPushNotification = async ({ fcm_token, title, body, data = {} }) => {
    if (!fcm_token) return null;

    try {
        // Convert all data values to strings (FCM requirement)
        const stringifiedData = {};
        for (const [k, v] of Object.entries(data)) {
            stringifiedData[k] = String(v);
        }

        const messageId = await admin.messaging().send({
            token: fcm_token,
            notification: { title, body },
            data: stringifiedData,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        });

        return messageId;
    } catch (error) {
        // Log but do NOT throw — push failure must never break the main response
        console.error('[FCM] Push failed:', error.message);
        return null;
    }
};

/**
 * Create a Notification record in DB + send FCM push if token is available.
 * Fire-and-forget style — errors are caught internally.
 *
 * @param {object} opts
 * @param {string}  opts.type         - Notification type enum
 * @param {string}  opts.title        - Push title
 * @param {string}  opts.body         - Push body
 * @param {object}  opts.data         - Extra payload (optional)
 * @param {ObjectId} [opts.user_id]   - User recipient (if applicable)
 * @param {ObjectId} [opts.worker_id] - Worker recipient (if applicable)
 * @param {string}  [opts.fcm_token]  - Device FCM token (optional — only push if provided)
 */
const createAndSendNotification = async ({
    type,
    title,
    body,
    data = null,
    user_id = null,
    worker_id = null,
    fcm_token = null,
}) => {
    try {
        // 1. Persist notification record to MongoDB
        const notification = await Notification.create({
            user_id,
            worker_id,
            title,
            body,
            type,
            data,
            is_sent: false,
        });

        // 2. Send FCM push (only if device token provided)
        let messageId = null;
        if (fcm_token) {
            messageId = await sendPushNotification({
                fcm_token,
                title,
                body,
                data: {
                    type,
                    notification_id: String(notification._id),
                    ...(data || {}),
                },
            });

            // Update sent status in DB
            if (messageId) {
                await Notification.findByIdAndUpdate(notification._id, {
                    $set: { is_sent: true, sent_at: new Date() },
                });
            }
        }

        return notification;
    } catch (error) {
        // Never throw — notification failure should not break core business logic
        console.error('[createAndSendNotification] Error:', error.message);
        return null;
    }
};

module.exports = { sendPushNotification, createAndSendNotification };
