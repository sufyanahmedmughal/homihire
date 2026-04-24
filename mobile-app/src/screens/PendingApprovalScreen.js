import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';
import { getMe } from '../services/api';
import {
  showApprovedNotification,
  showRejectedNotification,
} from '../services/notifications';

const POLL_INTERVAL_MS = 30_000; // check every 30 seconds

export default function PendingApprovalScreen({ navigation }) {
  const { logout, updateUser } = useAuth();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // ─── Entrance animation ────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ─── Status polling ────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (profile) => {
    await updateUser(profile);

    if (profile.status === 'approved') {
      await showApprovedNotification();
      navigation.reset({ index: 0, routes: [{ name: 'WorkerHome' }] });
    } else if (profile.status === 'rejected') {
      await showRejectedNotification(profile.rejection_reason || '');
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Rejected', params: { rejection_reason: profile.rejection_reason } },
        ],
      });
    }
  }, [navigation, updateUser]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getMe();
        if (cancelled) return;

        // Backend may return { worker: {...} } or the profile directly
        const profile = data?.worker ?? data?.user ?? data;

        if (profile?.status && profile.status !== 'pending') {
          await handleStatusChange(profile);
        }
      } catch (e) {
        if (cancelled) return;
        const status = e?.response?.status;

        if (status === 401 || status === 404) {
          // No valid session — stop polling and send to Login
          console.log('[PendingApproval] No valid session (', status, '), redirecting to Login.');
          clearInterval(interval);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        // Any other error (network timeout, 500) — silently retry
        console.log('[PendingApproval] Poll error (will retry):', e.message);
      }
    };

    // Poll immediately once when screen mounts, then every 30 s
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [handleStatusChange]);

  // ─── Logout ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  const steps = [
    { icon: '✅', title: 'Registration Complete',  desc: 'Your details have been submitted successfully' },
    { icon: '🔍', title: 'Under Review',            desc: 'Admin is verifying your credentials and documents', active: true },
    { icon: '🔔', title: 'Notification',            desc: "You'll be notified in-app as soon as a decision is made" },
    { icon: '🚀', title: 'Start Working',           desc: 'Accept jobs and start earning' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top amber glow */}
      <View style={styles.topGlow} />

      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={['rgba(245,166,35,0.2)', 'rgba(245,166,35,0.05)']}
            style={styles.iconGlow}
          >
            <LinearGradient colors={['#F5A623', '#E8901A']} style={styles.iconInner}>
              <Text style={styles.iconEmoji}>⏳</Text>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your worker account is under review. We're checking your details and will notify you automatically — no need to log in again.
        </Text>

        {/* Timeline */}
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.active && styles.timelineDotActive]}>
                  <Text style={styles.timelineDotIcon}>{step.icon}</Text>
                </View>
                {i < steps.length - 1 && (
                  <View style={[styles.timelineLine, step.active && styles.timelineLineActive]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, step.active && styles.timelineTitleActive]}>
                  {step.title}
                </Text>
                <Text style={styles.timelineDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>💡</Text>
          <Text style={styles.infoCardText}>
            Typical review time is{' '}
            <Text style={{ color: COLORS.primary, fontWeight: FONTS.semibold }}>24–48 hours</Text>.
            {' '}Keep the app installed — you'll get a push notification the moment admin approves or rejects your application.
          </Text>
        </View>

        {/* Polling indicator */}
        <View style={styles.pollingBadge}>
          <Text style={styles.pollingDot}>●</Text>
          <Text style={styles.pollingText}>Checking for updates every 30 seconds…</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: 80,
    paddingBottom: SPACING['4xl'],
    alignItems: 'center',
  },

  iconContainer: { marginBottom: SPACING['2xl'] },
  iconGlow: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  iconEmoji: { fontSize: 44 },

  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.extrabold,
    marginBottom: SPACING.md,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['3xl'],
    paddingHorizontal: SPACING.xl,
  },

  timeline: { alignSelf: 'stretch', marginBottom: SPACING['2xl'] },
  timelineItem: { flexDirection: 'row', minHeight: 72 },
  timelineLeft: { width: 44, alignItems: 'center' },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
    ...SHADOWS.glow,
  },
  timelineDotIcon: { fontSize: 16 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.surfaceBorder,
    marginTop: 4,
  },
  timelineLineActive: { backgroundColor: COLORS.primaryMuted },
  timelineContent: {
    flex: 1,
    paddingLeft: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  timelineTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    fontWeight: FONTS.semibold,
    marginBottom: 2,
  },
  timelineTitleActive: { color: COLORS.primary },
  timelineDesc: { color: COLORS.textMuted, fontSize: FONTS.xs, lineHeight: 18 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  infoCardIcon: { fontSize: 18 },
  infoCardText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sm, lineHeight: 20 },

  pollingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING['2xl'],
  },
  pollingDot: {
    fontSize: 10,
    color: COLORS.primary,
    opacity: 0.8,
  },
  pollingText: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
  },

  logoutBtn: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  logoutText: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: FONTS.medium },
});
