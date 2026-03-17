import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

export default function PendingApprovalScreen({ navigation }) {
  const { logout } = useAuth();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Pulse the clock icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  const steps = [
    { icon: '✅', title: 'Registration Complete', desc: 'Your details have been submitted successfully' },
    { icon: '🔍', title: 'Under Review', desc: 'Admin is verifying your credentials and documents', active: true },
    { icon: '🔔', title: 'Notification', desc: 'You\'ll receive an SMS when your account is approved' },
    { icon: '🚀', title: 'Start Working', desc: 'Accept jobs and start earning' },
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
          Your worker account is under review. Our team will verify your details and notify you shortly.
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
            Typical review time is <Text style={{ color: COLORS.primary, fontWeight: FONTS.semibold }}>24–48 hours</Text>. Keep your phone handy — you'll receive an SMS notification.
          </Text>
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

  iconContainer: {
    marginBottom: SPACING['2xl'],
  },
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

  timeline: {
    alignSelf: 'stretch',
    marginBottom: SPACING['2xl'],
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 72,
  },
  timelineLeft: {
    width: 44,
    alignItems: 'center',
  },
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
  timelineDesc: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
    lineHeight: 18,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  infoCardIcon: { fontSize: 18 },
  infoCardText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sm, lineHeight: 20 },

  logoutBtn: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  logoutText: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: FONTS.medium },
});
