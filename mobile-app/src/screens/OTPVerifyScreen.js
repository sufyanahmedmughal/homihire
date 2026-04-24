import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  TextInput, Animated, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { PrimaryButton, ScreenHeader, ErrorMessage } from '../components/ui';
import { sendFirebaseOTP, verifyFirebaseOTP, getFirebaseErrorMessage, firebaseConfig, firebaseApp } from '../services/firebase';
import { registerUser, registerWorker, reapplyWorker, loginWithFirebase } from '../services/api';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useAuth } from '../store/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

export default function OTPVerifyScreen({ navigation, route }) {
  const { flow, phone, registrationData } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const recaptchaVerifier = useRef(null);

  // Send OTP on mount
  useEffect(() => {
    sendOTP();
    return () => clearInterval(timerRef.current);
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendOTP = async () => {
    setSending(true);
    setError('');
    try {
      const conf = await sendFirebaseOTP(phone, recaptchaVerifier.current);
      setConfirmation(conf);
      startCountdown();
    } catch (err) {
      console.log('[OTPVerify] sendOTP error:', err.code, err.message);

      // User dismissed the reCAPTCHA modal — not a real error
      if (
        err.code === 'ERR_FIREBASE_RECAPTCHA_CANCEL' ||
        err.message?.toLowerCase().includes('cancel') ||
        err.message?.toLowerCase().includes('dismissed')
      ) {
        setError('Verification cancelled. Tap "Resend" to try again.');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
    } finally {
      setSending(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    sendOTP();
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Helper — extracts token & profile from multiple backend response shapes
  // Handles: { token } | { data.token } | { accessToken } | { jwt } | { access_token } etc.
  const extractSession = (data) => {
    const token =
      data?.token        ??
      data?.accessToken  ??
      data?.access_token ??
      data?.jwt          ??
      data?.bearer       ??
      data?.data?.token  ??
      data?.data?.accessToken ??
      data?.data?.access_token;

    const profile =
      data?.worker  ?? data?.data?.worker  ??
      data?.user    ?? data?.data?.user    ??
      data?.profile ?? data?.data?.profile ?? {};

    return { token, profile };
  };

  const verifyOTP = async (otpCode) => {
    if (!confirmation) {
      setError('OTP not sent yet. Please wait.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { firebaseIdToken } = await verifyFirebaseOTP(confirmation, otpCode);

      // After verification — call appropriate registration/login API
      if (flow === 'userRegister') {
        const data = await registerUser({ firebase_id_token: firebaseIdToken, ...registrationData });
        const { token, profile } = extractSession(data);
        await login({ token, role: 'user', profile });
        navigation.reset({ index: 0, routes: [{ name: 'UserHome' }] });

      } else if (flow === 'workerRegister') {
        const data = await registerWorker({ firebase_id_token: firebaseIdToken, ...registrationData });
        // 🔍 DEBUG: log raw response so we can identify the exact key names
        console.log('[OTPVerify] workerRegister raw response keys:', Object.keys(data || {}));
        console.log('[OTPVerify] workerRegister data:', JSON.stringify(data, null, 2));
        const { token: wToken, profile: wProfile } = extractSession(data);
        console.log('[OTPVerify] extracted token:', wToken ? wToken.substring(0, 20) + '...' : 'UNDEFINED — check response shape above');
        if (wToken) await login({ token: wToken, role: 'worker', profile: wProfile });
        navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });

      } else if (flow === 'workerReapply') {
        // Rejected worker re-applying — calls PUT /api/auth/worker/reapply
        const data = await reapplyWorker({ firebase_id_token: firebaseIdToken, ...registrationData });
        console.log('[OTPVerify] workerReapply raw response keys:', Object.keys(data || {}));
        const { token: rToken, profile: rProfile } = extractSession(data);
        if (rToken) await login({ token: rToken, role: 'worker', profile: rProfile });
        navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });

      } else if (flow === 'login') {
        const data = await loginWithFirebase({ firebase_id_token: firebaseIdToken, phone });
        const { token: lToken, profile: lProfile } = extractSession(data);
        // Use top-level profile field first (login endpoint may use data.profile)
        const workerProfile = data.profile ?? lProfile;

        if (data.role === 'user') {
          await login({ token: lToken || data.token, role: data.role, profile: workerProfile });
          navigation.reset({ index: 0, routes: [{ name: 'UserHome' }] });
        } else if (data.role === 'worker') {
          await login({ token: lToken || data.token, role: data.role, profile: workerProfile });
          if (workerProfile?.status === 'pending') {
            navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
          } else if (workerProfile?.status === 'rejected') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Rejected', params: { rejection_reason: workerProfile?.rejection_reason } }],
            });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'WorkerHome' }] });
          }
        }
      }

    } catch (err) {
      shake();
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Log full error for debugging
      console.log('[OTPVerify] Error:', JSON.stringify({
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      }, null, 2));

      // Firebase errors — only codes starting with 'auth/' are Firebase
      const isFirebaseError = err.code && String(err.code).startsWith('auth/');

      if (isFirebaseError) {
        setError(getFirebaseErrorMessage(err.code));
      } else if (!err.response) {
        // No HTTP response — either a JS error (AsyncStorage, undefined) or a real network error
        const isJsError = err.message?.includes('AsyncStorage')
          || err.message?.includes('undefined')
          || err.message?.includes('null');

        if (isJsError && (flow === 'workerRegister' || flow === 'workerReapply')) {
          // Backend likely registered the worker but token handling crashed locally.
          // Navigate to PendingApproval — worker can log in later.
          navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
          return;
        }
        setError('Cannot reach server. Please check your internet connection and try again.');
      } else {
        // HTTP error — backend returned a response
        const status = err.response?.status;
        const apiMsg = err.response?.data?.message;
        const apiErrors = err.response?.data?.errors;

        if (status === 409 && (flow === 'workerRegister' || flow === 'workerReapply')) {
          // Worker was registered on a previous attempt (first call succeeded, second call is duplicate).
          // Redirect to Login so they can authenticate with the existing account.
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        } else if (status === 400) {
          setError(apiMsg || (apiErrors && apiErrors[0]) || 'Invalid data. Please check your details.');
        } else if (status === 401) {
          setError(apiMsg || 'Authentication failed. Please try again.');
        } else if (status === 409) {
          setError(apiMsg || 'Phone already registered. Please login instead.');
        } else if (status === 403) {
          const msgLower = (apiMsg || '').toLowerCase();
          const rejectionReason = err.response?.data?.rejection_reason
            || err.response?.data?.data?.rejection_reason;
          if (msgLower.includes('under review') || msgLower.includes('pending')) {
            navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
          } else if (msgLower.includes('reject')) {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'Rejected',
                params: { rejection_reason: rejectionReason || apiMsg || 'Your application did not meet our requirements.' },
              }],
            });
          } else {
            setError(apiMsg || 'Account not active.');
          }
        } else if (status === 404) {
          setError(apiMsg || 'Phone not registered. Please sign up.');
        } else {
          setError(apiMsg || 'Verification failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      shake();
      return;
    }
    verifyOTP(code);
  };

  const maskedPhone = phone.replace(/(\d{4})(\d+)(\d{3})/, '$1****$3');
  const isComplete = otp.every((d) => d !== '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* reCAPTCHA verifier — must render before sendOTP is called.
           attemptInvisibleVerification=false: forces the standard visible reCAPTCHA.
           This avoids the 'reCAPTCHA Enterprise' init error that occurs with Firebase SDK v9+
           when invisible mode is used. */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        firebaseApp={firebaseApp}
        attemptInvisibleVerification={false}
        title="Verify it's you"
        cancelLabel="Cancel"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <ScreenHeader
            title="Verify Phone"
            subtitle={`Enter the 6-digit code sent to ${maskedPhone}`}
            onBack={() => navigation.goBack()}
          />

          {/* Phone badge */}
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneBadgeIcon}>📱</Text>
            <Text style={styles.phoneBadgeText}>{phone}</Text>
          </View>

          {/* OTP boxes */}
          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled,
                  error && styles.otpBoxError,
                ]}
              >
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v.replace(/[^0-9]/g, '').slice(-1), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpInput}
                  selectionColor={COLORS.primary}
                  autoFocus={index === 0}
                />
              </View>
            ))}
          </Animated.View>

          {error ? <ErrorMessage message={error} /> : null}

          {/* Sending indicator */}
          {sending && (
            <Text style={styles.sendingText}>Sending SMS to {maskedPhone}...</Text>
          )}

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>Didn't receive the code? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
            )}
          </View>

          {/* Verify button */}
          <PrimaryButton
            title={loading ? 'Verifying...' : 'Verify & Continue'}
            onPress={handleVerify}
            loading={loading}
            disabled={!isComplete || loading || sending}
            style={{ marginTop: SPACING['2xl'] }}
          />

          {/* Security note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityNoteIcon}>🔒</Text>
            <Text style={styles.securityNoteText}>
              Your phone is verified via Firebase Authentication. We never store OTP codes.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: SPACING['2xl'], paddingTop: 56 },

  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
    gap: SPACING.sm,
  },
  phoneBadgeIcon: { fontSize: 16 },
  phoneBadgeText: { color: COLORS.primary, fontWeight: FONTS.semibold, fontSize: FONTS.sm },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING['2xl'],
  },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
    ...SHADOWS.glow,
  },
  otpBoxError: { borderColor: COLORS.error, backgroundColor: COLORS.errorMuted },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
  },

  sendingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  resendHint: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  resendLink: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  resendCountdown: { color: COLORS.textMuted, fontSize: FONTS.sm },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING['3xl'],
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: SPACING.sm,
  },
  securityNoteIcon: { fontSize: 16, marginTop: 1 },
  securityNoteText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    lineHeight: 18,
  },
});
