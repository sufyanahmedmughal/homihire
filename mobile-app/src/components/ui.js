import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, Animated, StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

// ─── PrimaryButton ──────────────────────────────────────────────────────────

export const PrimaryButton = ({ title, onPress, loading, disabled, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={disabled ? ['#3A3A48', '#2E2E3C'] : ['#F5A623', '#E8901A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryBtn}
        >
          {loading ? (
            <ActivityIndicator color={disabled ? COLORS.textMuted : COLORS.textInverse} size="small" />
          ) : (
            <Text style={[styles.primaryBtnText, disabled && { color: COLORS.textMuted }]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SecondaryButton ─────────────────────────────────────────────────────────

export const SecondaryButton = ({ title, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryBtnText}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── StyledInput ─────────────────────────────────────────────────────────────

export const StyledInput = ({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', secureTextEntry, error,
  multiline, numberOfLines, maxLength, autoCapitalize = 'words',
  editable = true, style, inputStyle,
  leftIcon, rightIcon,
  autoDetected = false, // ← new: highlight when auto-filled from CNIC scan
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => Animated.timing(borderAnim, {
    toValue: 1, duration: 200, useNativeDriver: false,
  }).start();

  const onBlur = () => Animated.timing(borderAnim, {
    toValue: 0, duration: 200, useNativeDriver: false,
  }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? COLORS.error : autoDetected ? COLORS.success : COLORS.surfaceBorder,
      error ? COLORS.error : COLORS.primary,
    ],
  });

  return (
    <View style={[styles.inputWrapper, style]}>
      {label && (
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {autoDetected && (
            <View style={styles.autoDetectedBadge}>
              <Text style={styles.autoDetectedBadgeText}>✦ Auto-detected</Text>
            </View>
          )}
        </View>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          autoDetected && { borderColor: COLORS.success, backgroundColor: 'rgba(72,199,142,0.06)' },
        ]}
      >
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
          style={[
            styles.input,
            leftIcon && { paddingLeft: 0 },
            multiline && { height: numberOfLines * 20 + 24, textAlignVertical: 'top' },
            inputStyle,
          ]}
        />
        {rightIcon && <View style={styles.inputRightIcon}>{rightIcon}</View>}
      </Animated.View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
};

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

export const ScreenHeader = ({ title, subtitle, onBack }) => (
  <View style={styles.header}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
    )}
    <View style={styles.headerText}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// ─── Tag / Chip ───────────────────────────────────────────────────────────────

export const Tag = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tag, selected && styles.tagSelected]}
    activeOpacity={0.8}
  >
    <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export const SectionTitle = ({ text }) => (
  <Text style={styles.sectionTitle}>{text}</Text>
);

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorBoxText}>{message}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // PrimaryButton
  primaryBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    ...SHADOWS.glow,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    letterSpacing: 0.3,
  },

  // SecondaryButton
  secondaryBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    backgroundColor: COLORS.surfaceElevated,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
  },

  // Input
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  autoDetectedBadge: {
    backgroundColor: 'rgba(72,199,142,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(72,199,142,0.4)',
  },
  autoDetectedBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: FONTS.bold,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  inputRightIcon: { marginLeft: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    fontWeight: FONTS.regular,
  },
  inputError: {
    color: COLORS.error,
    fontSize: FONTS.xs,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING['3xl'],
    paddingTop: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  backIcon: { color: COLORS.textPrimary, fontSize: FONTS.xl, marginTop: -2 },
  headerText: { flex: 1 },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.extrabold,
    lineHeight: 36,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    marginTop: SPACING.xs,
    lineHeight: 22,
  },

  // Tag
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceElevated,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },
  tagTextSelected: { color: COLORS.primary, fontWeight: FONTS.semibold },

  // Misc
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.xl,
  },
  errorBox: {
    backgroundColor: COLORS.errorMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: SPACING.lg,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    lineHeight: 20,
  },
});
