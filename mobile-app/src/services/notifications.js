/**
 * notifications.js
 *
 * Handles:
 *  - Notification permission request
 *  - FCM / Device push token retrieval
 *  - Foreground notification display
 *  - Helpers to show local "approved" / "rejected" alerts
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Foreground handler ────────────────────────────────────────────────────
// Always show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Android notification channel ─────────────────────────────────────────
export const setupNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('homihire', {
    name: 'HomiHire',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F5A623',
    sound: 'default',
  });
};

// ─── Permission ────────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// ─── FCM / Device Token ────────────────────────────────────────────────────
/**
 * Returns the FCM device token (Android) or APNS token (iOS).
 * Works in standalone / EAS builds.
 * Returns null in Expo Go (expected — log is a warning, not an error).
 */
export const getFCMToken = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }
    await setupNotificationChannel();
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData?.data ?? null;
    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 30) + '...');
    }
    return token;
  } catch (e) {
    // Expo Go doesn't support getDevicePushTokenAsync — this is expected
    console.warn('[FCM] Could not get device push token (normal in Expo Go):', e.message);
    return null;
  }
};

// ─── Local notification helpers ────────────────────────────────────────────
/**
 * Show an immediate local notification.
 * @param {string} title
 * @param {string} body
 * @param {object} data  – arbitrary payload attached to notification tap
 */
export const showLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'homihire' }),
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    console.warn('[Notifications] showLocalNotification failed:', e.message);
  }
};

export const showApprovedNotification = () =>
  showLocalNotification(
    '🎉 Application Approved!',
    'Congratulations! Your worker account is now active. You can start accepting jobs.',
    { type: 'approved' }
  );

export const showRejectedNotification = (reason = '') =>
  showLocalNotification(
    '❌ Application Rejected',
    reason
      ? `Reason: ${reason}. Tap to re-apply.`
      : 'Your application was rejected. Tap to see details and re-apply.',
    { type: 'rejected', reason }
  );
