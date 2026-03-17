/**
 * Firebase Phone Authentication Service
 *
 * Uses Firebase JS SDK with expo-firebase-recaptcha for Expo Go compatibility.
 * The reCAPTCHA modal is rendered in the screen and its ref is passed here.
 *
 * IMPORTANT: For Expo Go (development):
 *   Add test phone numbers in Firebase Console → Authentication → Sign-in method → Phone
 *   e.g. +923001234567 with code 123456
 *   Real SMS works in EAS Build / APK / standalone builds.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithPhoneNumber,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration — set via .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate init)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with AsyncStorage persistence
let firebaseAuth;
try {
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized (hot reload)
  firebaseAuth = getAuth(app);
}

export { firebaseAuth, firebaseConfig, app as firebaseApp };

/**
 * Convert Pakistani phone format to international
 * '03001234567' → '+923001234567'
 */
export const toInternationalFormat = (phone) => {
  if (!phone) return '';
  return phone.replace(/^0/, '+92');
};

/**
 * Convert international format back to Pakistani
 * '+923001234567' → '03001234567'
 */
export const toPakistaniFormat = (phone) => {
  if (!phone) return '';
  return phone.replace('+92', '0');
};

/**
 * Validate Pakistani phone number format
 * Must be: 03XXXXXXXXX (11 digits)
 */
export const isValidPakistaniPhone = (phone) => {
  return /^03[0-9]{9}$/.test(phone);
};

/**
 * Validate CNIC format: XXXXX-XXXXXXX-X
 */
export const isValidCNIC = (cnic) => {
  return /^\d{5}-\d{7}-\d$/.test(cnic);
};

/**
 * Send OTP via Firebase Phone Authentication
 *
 * @param {string} phone             - Pakistani format: '03001234567'
 * @param {object} recaptchaVerifier - FirebaseRecaptchaVerifierModal ref.current from the screen
 * @returns {Object}                  - Firebase confirmation object
 */
export const sendFirebaseOTP = async (phone, recaptchaVerifier) => {
  const internationalPhone = toInternationalFormat(phone);
  console.log('[Firebase OTP] Sending to:', internationalPhone);
  console.log('[Firebase OTP] API Key present:', !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
  console.log('[Firebase OTP] Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA verifier not ready. Please wait and try again.');
  }

  try {
    const confirmation = await signInWithPhoneNumber(
      firebaseAuth,
      internationalPhone,
      recaptchaVerifier
    );
    console.log('[Firebase OTP] SMS sent successfully ✓');
    return confirmation;
  } catch (err) {
    console.error('[Firebase OTP] Send failed:', err.code, err.message);
    throw err;
  }
};

/**
 * Verify OTP entered by user
 * @param {Object} confirmation  - From sendFirebaseOTP
 * @param {string} otp           - 6-digit code entered by user
 * @returns {{ firebaseIdToken, firebaseUid, firebasePhone }}
 */
export const verifyFirebaseOTP = async (confirmation, otp) => {
  console.log('[Firebase OTP] Verifying code...');
  try {
    const result = await confirmation.confirm(otp);
    const firebaseIdToken = await result.user.getIdToken();
    console.log('[Firebase OTP] Verification success ✓ UID:', result.user.uid);
    return {
      firebaseIdToken,
      firebaseUid: result.user.uid,
      firebasePhone: result.user.phoneNumber,
    };
  } catch (err) {
    console.error('[Firebase OTP] Verify failed:', err.code, err.message);
    throw err;
  }
};

/**
 * Map Firebase error codes to user-friendly messages
 */
export const getFirebaseErrorMessage = (errorCode) => {
  const messages = {
    // OTP verification
    'auth/invalid-verification-code': 'Wrong code. Please check and try again.',
    'auth/code-expired': 'Code expired. Please request a new one.',
    'auth/missing-verification-code': 'Please enter the verification code.',

    // Phone number
    'auth/invalid-phone-number': 'Invalid phone number. Use format: 03XXXXXXXXX',
    'auth/missing-phone-number': 'Please enter a phone number.',

    // Rate limiting
    'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later.',

    // reCAPTCHA & web
    'auth/captcha-check-failed': 'Security check failed. Please restart and try again.',
    'auth/recaptcha-not-enabled': 'reCAPTCHA not enabled. Check Firebase Console settings.',
    'auth/web-storage-unsupported': 'Browser storage unavailable. Try restarting the app.',

    // Account
    'auth/user-disabled': 'This phone number has been disabled.',
    'auth/operation-not-allowed': 'Phone sign-in is not enabled. Contact support.',

    // Network
    'auth/network-request-failed': 'Network error. Please check your internet connection.',

    // Internal
    'auth/internal-error': 'An internal error occurred. Please try again.',
  };
  return (
    messages[errorCode] ||
    (errorCode
      ? `Verification failed (${errorCode}). Please try again.`
      : 'Something went wrong. Please try again.')
  );
};
