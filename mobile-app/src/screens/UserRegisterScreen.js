import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import {
  PrimaryButton, SecondaryButton, StyledInput,
  ScreenHeader, ErrorMessage,
} from '../components/ui';
import LiveCameraCapture from '../components/LiveCameraCapture';
import { isValidPakistaniPhone } from '../services/firebase';
import { uploadToCloudinary } from '../services/api';

export default function UserRegisterScreen({ navigation, route }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  // ─── Local image only (NOT yet uploaded) ──────────────────────────────────
  const [profileImage, setProfileImage] = useState(null);

  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);

  // ─── Submitting state (upload + navigate) ─────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // Passed from OTPVerifyScreen (post-OTP, form data preserved)
  const prefilled = route?.params?.prefilled || {};

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    else if (form.name.trim().length > 100) newErrors.name = 'Name must be under 100 characters';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!isValidPakistaniPhone(form.phone.trim())) newErrors.phone = 'Format: 03XXXXXXXXX';
    if (!profileImage) newErrors.profileImage = 'Live photo is required';
    if (!location) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Camera capture: store locally only ───────────────────────────────────
  const handleCameraCapture = (uri) => {
    setCameraVisible(false);
    setProfileImage(uri);
    setErrors((e) => ({ ...e, profileImage: null }));
  };

  const handleRetake = () => {
    setProfileImage(null);
    setCameraVisible(true);
  };

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow location access.');
      return;
    }
    setFetchingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocation({ lat: latitude, lng: longitude });

      // Reverse geocode for display
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded[0]) {
        const { street, city, region } = geocoded[0];
        setLocationText([street, city, region].filter(Boolean).join(', '));
      } else {
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      setErrors((e) => ({ ...e, location: null }));
    } catch (err) {
      Alert.alert('Location Error', 'Could not detect location. Please try again.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // ─── Submit: validate → upload photo → navigate ───────────────────────────
  const handleNext = async () => {
    setGlobalError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Upload profile photo only when the form is fully complete
      const profileImageUrl = await uploadToCloudinary(profileImage, 'avatars');

      navigation.navigate('OTPVerify', {
        flow: 'userRegister',
        phone: form.phone.trim(),
        registrationData: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          profile_picture_url: profileImageUrl,
          location,
        },
      });
    } catch (err) {
      setGlobalError('Photo upload failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Live Camera Modal */}
      <LiveCameraCapture
        visible={cameraVisible}
        onCapture={handleCameraCapture}
        onClose={() => setCameraVisible(false)}
        facing="front"
        guideType="face"
        title="Take your profile photo"
        subtitle="Center your face in the guide"
      />

      {/* Full-screen overlay while uploading */}
      {submitting && (
        <View style={styles.submitOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.submitOverlayText}>Uploading photo…</Text>
          <Text style={styles.submitOverlayHint}>Please wait, do not close the app</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Create Account"
            subtitle="Set up your user profile to start hiring services"
            onBack={() => navigation.goBack()}
          />

          {globalError ? <ErrorMessage message={globalError} /> : null}

          {/* Upload-on-submit info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🔒</Text>
            <Text style={styles.infoBannerText}>
              Your photo is uploaded securely only when you complete and submit this form.
            </Text>
          </View>

          {/* Live Photo Capture */}
          <Text style={styles.sectionLabel}>LIVE PHOTO VERIFICATION</Text>
          {profileImage ? (
            <View style={styles.capturedContainer}>
              <Image source={{ uri: profileImage }} style={styles.capturedImage} />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Photo captured (uploads on submit)</Text>
              </View>
              <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn} activeOpacity={0.8}>
                <Text style={styles.retakeBtnText}>🔄 Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setCameraVisible(true)}
              style={[styles.liveCapturePicker, errors.profileImage && styles.liveCapturePickerError]}
              activeOpacity={0.8}
            >
              <View style={styles.liveCaptureContent}>
                <View style={styles.cameraIconCircle}>
                  <Text style={styles.cameraIcon}>📸</Text>
                </View>
                <Text style={styles.liveCaptureTitle}>Tap to open camera</Text>
                <Text style={styles.liveCaptureHint}>Live photo required for verification</Text>
                <View style={styles.liveBadgeSmall}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveLabelSmall}>LIVE DETECTION</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          {errors.profileImage && <Text style={styles.fieldError}>{errors.profileImage}</Text>}

          {/* Name */}
          <StyledInput
            label="Full Name"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Ahmed Ali"
            maxLength={100}
            autoCapitalize="words"
            error={errors.name}
          />

          {/* Phone */}
          <StyledInput
            label="Phone Number"
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="03001234567"
            keyboardType="phone-pad"
            maxLength={11}
            autoCapitalize="none"
            error={errors.phone}
          />

          {/* Location */}
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <TouchableOpacity
            onPress={detectLocation}
            style={[
              styles.locationBtn,
              location && styles.locationBtnActive,
              errors.location && styles.locationBtnError,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.locationBtnIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationBtnText, location && { color: COLORS.textPrimary }]}>
                {fetchingLocation ? 'Detecting...' : location ? locationText || 'Location detected' : 'Detect my location'}
              </Text>
              {location && <Text style={styles.locationCoords}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>}
            </View>
            {location && <Text style={styles.locationCheck}>✓</Text>}
          </TouchableOpacity>
          {errors.location && <Text style={styles.fieldError}>{errors.location}</Text>}

          {/* Submit */}
          <PrimaryButton
            title={submitting ? 'Uploading & Sending OTP…' : 'Send OTP & Continue'}
            onPress={handleNext}
            disabled={submitting || fetchingLocation}
            style={{ marginTop: SPACING['3xl'] }}
          />

          <Text style={styles.disclaimer}>
            By continuing, you agree that homiHire will send a verification code to your phone number.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: 56,
    paddingBottom: SPACING['4xl'],
  },

  // Full-screen overlay during upload-on-submit
  submitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: SPACING.md,
  },
  submitOverlayText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    marginTop: SPACING.md,
  },
  submitOverlayHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
  },

  // Upload-on-submit info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74,158,255,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.2)',
    gap: SPACING.sm,
  },
  infoBannerIcon: { fontSize: 16, marginTop: 1 },
  infoBannerText: {
    flex: 1,
    color: COLORS.info,
    fontSize: FONTS.xs,
    lineHeight: 18,
    fontWeight: FONTS.medium,
  },

  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // Live capture picker (before capture)
  liveCapturePicker: {
    height: 160,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  liveCapturePickerError: { borderColor: COLORS.error },
  liveCaptureContent: { alignItems: 'center' },
  cameraIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245,166,35,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cameraIcon: { fontSize: 26 },
  liveCaptureTitle: {
    color: COLORS.primary,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    marginBottom: 4,
  },
  liveCaptureHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    marginBottom: SPACING.md,
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224,82,82,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  liveLabelSmall: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: FONTS.bold,
    letterSpacing: 1,
  },

  // Captured photo view
  capturedContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.surfaceElevated,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: RADIUS.xl - 2,
    borderTopRightRadius: RADIUS.xl - 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
    backgroundColor: COLORS.successMuted,
  },
  verifiedIcon: {
    color: COLORS.success,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  verifiedText: {
    color: COLORS.success,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  retakeBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  retakeBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },

  // Location
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.xl,
  },
  locationBtnActive: { borderColor: COLORS.success },
  locationBtnError: { borderColor: COLORS.error },
  locationBtnIcon: { fontSize: 22, marginRight: SPACING.md },
  locationBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    fontWeight: FONTS.medium,
  },
  locationCoords: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
    marginTop: 2,
  },
  locationCheck: { color: COLORS.success, fontSize: FONTS.xl, fontWeight: FONTS.bold },

  fieldError: {
    color: COLORS.error,
    fontSize: FONTS.xs,
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
});
