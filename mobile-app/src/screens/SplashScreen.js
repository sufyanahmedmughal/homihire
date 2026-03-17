import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']}
      style={styles.container}
    >
      {/* Background decorative circles */}
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircleLarge,
          { transform: [{ scale: circleScale }], opacity: circleScale.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15],
          })},
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircleSmall,
          { transform: [{ scale: circleScale }], opacity: circleScale.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1],
          })},
        ]}
      />

      {/* Logo area */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Icon mark */}
        <View style={styles.iconMark}>
          <LinearGradient
            colors={['#F5A623', '#E8901A']}
            style={styles.iconGradient}
          >
            <Text style={styles.iconText}>H</Text>
          </LinearGradient>
        </View>

        {/* Brand name */}
        <Text style={styles.brandName}>
          homi<Text style={styles.brandAccent}>Hire</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Home Services, Simplified
      </Animated.Text>

      {/* Bottom indicator */}
      <Animated.View style={[styles.loadingBar, { opacity: taglineOpacity }]}>
        <LinearGradient
          colors={['#F5A623', '#E8901A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loadingBarFill}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  bgCircleLarge: {
    width: width * 1.4,
    height: width * 1.4,
    top: -width * 0.5,
    left: -width * 0.2,
  },
  bgCircleSmall: {
    width: width * 0.9,
    height: width * 0.9,
    bottom: -width * 0.4,
    right: -width * 0.2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    marginBottom: SPACING.xl,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#0A0A0F',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    fontWeight: FONTS.medium,
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  loadingBar: {
    position: 'absolute',
    bottom: 60,
    width: 80,
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
});
