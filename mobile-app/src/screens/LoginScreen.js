import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { PrimaryButton, SecondaryButton, StyledInput, ErrorMessage } from '../components/ui';
import { isValidPakistaniPhone } from '../services/firebase';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = () => {
    setError('');
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!isValidPakistaniPhone(phone.trim())) {
      setError('Invalid phone format. Use 03XXXXXXXXX');
      return;
    }
    navigation.navigate('OTPVerify', {
      flow: 'login',
      phone: phone.trim(),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View style={[styles.logoRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={['#F5A623', '#E8901A']} style={styles.logoIcon}>
              <Text style={styles.logoIconText}>H</Text>
            </LinearGradient>
            <Text style={styles.logoText}>homi<Text style={{ color: COLORS.primary }}>Hire</Text></Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your homiHire account using your registered phone number
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {error ? <ErrorMessage message={error} /> : null}

            <StyledInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="03001234567"
              keyboardType="phone-pad"
              maxLength={11}
              autoCapitalize="none"
              style={{ marginTop: SPACING['2xl'] }}
            />

            {/* Pakistani flag hint */}
            <View style={styles.flagHint}>
              <Text style={styles.flagHintText}>🇵🇰  Pakistani mobile numbers only (03XXXXXXXXX)</Text>
            </View>

            <PrimaryButton
              title="Send Verification Code"
              onPress={handleLogin}
              style={{ marginTop: SPACING['2xl'] }}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <SecondaryButton
              title="Create New Account"
              onPress={() => navigation.navigate('RoleSelect')}
            />

            {/* How it works */}
            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>How it works</Text>
              {[
                ['1', 'Enter your registered phone number'],
                ['2', 'Receive a 6-digit OTP via SMS'],
                ['3', 'Verify to access your account'],
              ].map(([num, text]) => (
                <View key={num} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{num}</Text>
                  </View>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING['2xl'], paddingTop: 60, paddingBottom: SPACING['4xl'] },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
    gap: SPACING.sm,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: { color: '#0A0A0F', fontSize: 22, fontWeight: '900' },
  logoText: { color: COLORS.textPrimary, fontSize: FONTS['2xl'], fontWeight: FONTS.bold },

  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS['4xl'],
    fontWeight: FONTS.extrabold,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    lineHeight: 24,
  },

  flagHint: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginTop: -SPACING.sm,
  },
  flagHintText: { color: COLORS.textSecondary, fontSize: FONTS.xs },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING['2xl'],
    gap: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceBorder },
  dividerText: { color: COLORS.textMuted, fontSize: FONTS.sm, fontWeight: FONTS.medium },

  howItWorks: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING['2xl'],
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  howItWorksTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.lg,
  },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  stepText: { color: COLORS.textSecondary, fontSize: FONTS.sm, flex: 1 },
});
