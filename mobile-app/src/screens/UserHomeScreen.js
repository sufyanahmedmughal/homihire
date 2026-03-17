/**
 * UserHomeScreen — Placeholder for Slice 1
 * Real functionality added in Slice 3 (Job Posting)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

export default function UserHomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <LinearGradient colors={['#F5A623', '#E8901A']} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || 'User'} 👋</Text>
          </View>
        </View>

        {/* Auth success badge */}
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✅</Text>
          <View>
            <Text style={styles.successTitle}>Account Active</Text>
            <Text style={styles.successSub}>Slice 1 authentication complete</Text>
          </View>
        </View>

        {/* Coming soon */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>🏠</Text>
          <Text style={styles.comingSoonTitle}>Home Services Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Browse and book home services in Slice 3 — currently in development.
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: SPACING['2xl'], paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING['3xl'], gap: SPACING.lg },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarGradient: { width: '100%', height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0A0A0F', fontSize: FONTS['2xl'], fontWeight: '900' },
  greeting: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  name: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: FONTS.bold },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: SPACING.md,
  },
  successIcon: { fontSize: 28 },
  successTitle: { color: COLORS.success, fontWeight: FONTS.bold, fontSize: FONTS.md },
  successSub: { color: COLORS.textSecondary, fontSize: FONTS.xs },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  comingSoonIcon: { fontSize: 64, marginBottom: SPACING.xl },
  comingSoonTitle: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: FONTS.bold, marginBottom: SPACING.sm, textAlign: 'center' },
  comingSoonText: { color: COLORS.textSecondary, fontSize: FONTS.md, textAlign: 'center', lineHeight: 24 },
  logoutBtn: {
    alignSelf: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING['3xl'],
  },
  logoutText: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: FONTS.medium },
});
