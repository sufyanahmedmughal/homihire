import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const RoleCard = ({ icon, title, subtitle, tag, gradient, onPress, delay }) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.roleCardOuter}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roleCard}
        >
          {/* Tag */}
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{tag}</Text>
          </View>

          {/* Icon */}
          <Text style={styles.roleIcon}>{icon}</Text>

          {/* Text */}
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>

          {/* Arrow */}
          <View style={styles.roleArrow}>
            <Text style={styles.roleArrowText}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RoleSelectScreen({ navigation }) {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          {/* Logo pill */}
          <View style={styles.logoPill}>
            <LinearGradient
              colors={['#F5A623', '#E8901A']}
              style={styles.logoPillGradient}
            >
              <Text style={styles.logoPillText}>H</Text>
            </LinearGradient>
            <Text style={styles.logoText}>homi<Text style={{ color: COLORS.primary }}>Hire</Text></Text>
          </View>

          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started with homiHire
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <RoleCard
          icon="🏠"
          title="I am a User"
          subtitle="Find trusted professionals for home services — cleaning, plumbing, electrical & more"
          tag="HIRE SERVICES"
          gradient={['#1C1C26', '#252532']}
          onPress={() => navigation.navigate('UserRegister')}
          delay={200}
        />

        <RoleCard
          icon="🔧"
          title="I am a Worker"
          subtitle="Offer your skills and earn money by helping households in your city"
          tag="OFFER SERVICES"
          gradient={['#1C1C26', '#252532']}
          onPress={() => navigation.navigate('WorkerRegister')}
          delay={350}
        />

        {/* Login link */}
        <Animated.View style={[styles.loginRow, { opacity: headerAnim }]}>
          <Text style={styles.loginHint}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: 60,
    paddingBottom: SPACING['4xl'],
  },
  header: {
    marginBottom: SPACING['3xl'],
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoPillGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  logoPillText: {
    color: '#0A0A0F',
    fontSize: FONTS.xl,
    fontWeight: FONTS.black,
  },
  logoText: {
    color: COLORS.textPrimary,
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS['4xl'],
    fontWeight: FONTS.extrabold,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    lineHeight: 24,
  },

  // Role card
  roleCardOuter: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  roleCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    minHeight: 200,
    overflow: 'hidden',
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
  },
  roleTagText: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    letterSpacing: 1,
  },
  roleIcon: {
    fontSize: 44,
    marginBottom: SPACING.md,
  },
  roleTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.extrabold,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  roleSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  roleArrow: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowText: {
    color: COLORS.primary,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
  },

  // Login row
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
});
