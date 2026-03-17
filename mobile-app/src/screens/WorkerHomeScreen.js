/**
 * WorkerHomeScreen — Placeholder for Slice 1
 * Real job feed functionality added in Slice 3
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

export default function WorkerHomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <LinearGradient colors={['#F5A623', '#E8901A']} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{(user?.name || 'W')[0].toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.greeting}>Ready to work,</Text>
            <Text style={styles.name}>{user?.name || 'Worker'} 🔧</Text>
          </View>
        </View>

        <View style={styles.successBadge}>
          <Text style={{ fontSize: 28 }}>✅</Text>
          <View>
            <Text style={styles.successTitle}>Account Approved</Text>
            <Text style={styles.successSub}>You can now receive job requests</Text>
          </View>
        </View>

        <View style={styles.comingSoon}>
          <Text style={{ fontSize: 64, marginBottom: SPACING.xl }}>🔨</Text>
          <Text style={styles.comingSoonTitle}>Job Feed Coming in Slice 3</Text>
          <Text style={styles.comingSoonText}>
            Accept job requests from nearby users once job posting is implemented.
          </Text>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
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
  successTitle: { color: COLORS.success, fontWeight: FONTS.bold, fontSize: FONTS.md },
  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
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
