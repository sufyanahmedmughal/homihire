import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

export default function RejectedScreen({ navigation, route }) {
  const { logout, user } = useAuth();

  // Rejection reason can come from route params or from the stored user profile
  const rejectionReason =
    route?.params?.rejection_reason ||
    user?.rejection_reason ||
    'Your application did not meet our verification requirements.';

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Shake the icon once to draw attention
    const shake = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]);
    const timer = setTimeout(() => shake.start(), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = async () => {
    // Ensure any cached session is cleared (e.g., if reached via app restart
    // with a previously stored rejected status), then navigate to re-register.
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'WorkerRegister', params: { isReapply: true } }],
    });
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  const issues = [
    { icon: '📋', text: 'Review the rejection reason carefully below' },
    { icon: '🪪', text: 'Ensure your CNIC photos are clear and legible' },
    { icon: '🤳', text: 'Make sure your selfie shows your face clearly' },
    { icon: '✅', text: 'Verify all information matches your CNIC exactly' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Red glow top */}
      <View style={styles.topGlow} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ translateX: shakeAnim }] }]}>
            <LinearGradient
              colors={['rgba(224,82,82,0.2)', 'rgba(224,82,82,0.05)']}
              style={styles.iconGlow}
            >
              <LinearGradient colors={['#E05252', '#C23838']} style={styles.iconInner}>
                <Text style={styles.iconEmoji}>✗</Text>
              </LinearGradient>
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Application Rejected</Text>
          <Text style={styles.subtitle}>
            Unfortunately, your worker account application has been declined by our review team.
          </Text>

          {/* Rejection Reason Card */}
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <Text style={styles.reasonHeaderIcon}>⚠️</Text>
              <Text style={styles.reasonHeaderTitle}>Reason for Rejection</Text>
            </View>
            <Text style={styles.reasonText}>{rejectionReason}</Text>
          </View>

          {/* What to do checklist */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>What to do before retrying:</Text>
            {issues.map((item, i) => (
              <View key={i} style={styles.checklistItem}>
                <Text style={styles.checklistIcon}>{item.icon}</Text>
                <Text style={styles.checklistText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Retry Button */}
          <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={['#F5A623', '#E8901A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>🔄  Re-apply Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    backgroundColor: COLORS.error,
    opacity: 0.07,
  },
  scroll: { flexGrow: 1 },
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
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  iconEmoji: { fontSize: 42, color: '#fff', fontWeight: '900' },

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

  // Rejection Reason Card
  reasonCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(224,82,82,0.35)',
    padding: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  reasonHeaderIcon: { fontSize: 16 },
  reasonHeaderTitle: {
    color: COLORS.error,
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reasonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
    lineHeight: 24,
    fontWeight: FONTS.medium,
  },

  // Checklist
  checklistCard: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
    marginBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  checklistTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  checklistIcon: { fontSize: 16, marginTop: 1 },
  checklistText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    lineHeight: 20,
  },

  // Retry button
  retryBtn: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
    marginBottom: SPACING.lg,
  },
  retryGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    letterSpacing: 0.2,
  },

  // Logout
  logoutBtn: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  logoutText: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: FONTS.medium },
});
