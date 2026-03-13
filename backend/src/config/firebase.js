const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccount = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                : undefined,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
        };

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });

        console.log('✅ Firebase Admin initialized');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        throw error;
    }
};

/**
 * Send a push notification via Firebase Cloud Messaging (FCM)
 * @param {string} fcmToken - Device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional extra data payload
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) {
        console.warn('⚠️  No FCM token provided — skipping push notification');
        return null;
    }

    try {
        const message = {
            notification: { title, body },
            data: { ...data },
            token: fcmToken,
            android: {
                notification: {
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log(`✅ Push notification sent: ${response}`);
        return response;
    } catch (error) {
        console.error('❌ FCM send error:', error.message);
        // Non-fatal — log and continue
        return null;
    }
};

module.exports = { initializeFirebase, sendPushNotification };
