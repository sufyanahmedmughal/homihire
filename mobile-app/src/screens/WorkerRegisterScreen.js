import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import {
  PrimaryButton, StyledInput, ScreenHeader, ErrorMessage, Tag, SectionTitle,
} from '../components/ui';
import LiveCameraCapture from '../components/LiveCameraCapture';
import ImageCropModal from '../components/ImageCropModal';
import { isValidPakistaniPhone, isValidCNIC } from '../services/firebase';
import { uploadToCloudinary } from '../services/api';
import { extractCNICData } from '../services/cnicOcr';

const SKILL_CATEGORIES = [
  { id: 'Cleaning', label: '🧹 Cleaning' },
  { id: 'Plumbing', label: '🔧 Plumbing' },
  { id: 'Electrical', label: '⚡ Electrical' },
  { id: 'Carpentry', label: '🪵 Carpentry' },
  { id: 'Building / Construction', label: '🏗️ Construction' },
  { id: 'Repairing / Maintenance', label: '🔨 Repairing' },
];

export default function WorkerRegisterScreen({ navigation, route }) {
  // isReapply = true when coming from RejectedScreen → use reapply endpoint
  const isReapply = route?.params?.isReapply === true;
  const [form, setForm] = useState({
    name: '',
    cnic: '',
    phone: '',
    fee: '',
  });
  const [errors, setErrors] = useState({});

  // ─── Local images (NOT yet uploaded) ──────────────────────────────────────
  const [selfieImage, setSelfieImage] = useState(null);
  const [cnicFrontImage, setCnicFrontImage] = useState(null);
  const [cnicBackImage, setCnicBackImage] = useState(null);

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // ─── Submitting state (uploading + navigating) ─────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // CNIC OCR state
  const [scanningCnic, setScanningCnic] = useState(false);
  const [autoDetectedFields, setAutoDetectedFields] = useState({});

  // Camera / Crop modal state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cropVisible, setCropVisible] = useState(false);
  const [cropImageUri, setCropImageUri] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'cnic_front' | 'cnic_back'
  const [cameraMode, setCameraMode] = useState('selfie');

  const openCamera = (mode) => {
    setCameraMode(mode);
    setCameraVisible(true);
  };

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
    setErrors((e) => ({ ...e, skills: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    else if (form.name.trim().length > 100) newErrors.name = 'Name must be under 100 characters';
    if (!form.cnic.trim()) newErrors.cnic = 'CNIC is required';
    else if (!isValidCNIC(form.cnic.trim())) newErrors.cnic = 'Format: XXXXX-XXXXXXX-X';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!isValidPakistaniPhone(form.phone.trim())) newErrors.phone = 'Format: 03XXXXXXXXX';
    if (!form.fee.trim()) newErrors.fee = 'Daily fee is required';
    else if (isNaN(Number(form.fee)) || Number(form.fee) <= 0) newErrors.fee = 'Enter a valid fee';
    if (!selfieImage) newErrors.selfie = 'Live selfie is required';
    if (!cnicFrontImage) newErrors.cnicFront = 'CNIC front photo is required';
    if (!cnicBackImage) newErrors.cnicBack = 'CNIC back photo is required';
    if (selectedSkills.length === 0) newErrors.skills = 'Select at least one skill';
    if (!location) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Camera capture handler ────────────────────────────────────────────────
  const handleCameraCapture = async (uri) => {
    setCameraVisible(false);

    if (cameraMode === 'selfie') {
      // Store locally — no upload yet
      setSelfieImage(uri);
      setErrors((e) => ({ ...e, selfie: null }));
    } else if (cameraMode === 'cnic_front' || cameraMode === 'cnic_back') {
      // CNIC — open crop modal first
      setCropImageUri(uri);
      setCropTarget(cameraMode);
      setCropVisible(true);
    }
  };

  // ─── Crop complete handler ─────────────────────────────────────────────────
  const handleCropComplete = async (croppedUri) => {
    setCropVisible(false);
    const target = cropTarget;
    setCropImageUri(null);
    setCropTarget(null);

    if (target === 'cnic_front') {
      setCnicFrontImage(croppedUri);
      setErrors((e) => ({ ...e, cnicFront: null }));

      // Run OCR only (no upload) so we can auto-fill fields
      setScanningCnic(true);
      setAutoDetectedFields({});
      try {
        const ocrData = await extractCNICData(croppedUri);
        const detected = {};
        if (ocrData?.name && !form.name.trim()) {
          setForm((f) => ({ ...f, name: ocrData.name }));
          detected.name = true;
          setErrors((e) => ({ ...e, name: null }));
        }
        if (ocrData?.cnic && !form.cnic.trim()) {
          setForm((f) => ({ ...f, cnic: ocrData.cnic }));
          detected.cnic = true;
          setErrors((e) => ({ ...e, cnic: null }));
        }
        if (Object.keys(detected).length > 0) {
          setAutoDetectedFields(detected);
        }
      } catch {
        // OCR failure is non-critical — user can fill fields manually
      } finally {
        setScanningCnic(false);
      }
    } else if (target === 'cnic_back') {
      // Store locally — no upload yet
      setCnicBackImage(croppedUri);
      setErrors((e) => ({ ...e, cnicBack: null }));
    }
  };

  // Called when user cancels crop — use original uncropped image
  const handleCropCancel = () => {
    const uri = cropImageUri;
    handleCropComplete(uri);
  };

  const handleRetakeSelfie = () => {
    setSelfieImage(null);
    openCamera('selfie');
  };

  const handleRetakeCnicFront = () => {
    setCnicFrontImage(null);
    setAutoDetectedFields({});
    openCamera('cnic_front');
  };

  const handleRetakeCnicBack = () => {
    setCnicBackImage(null);
    openCamera('cnic_back');
  };

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Location access is required.');
      return;
    }
    setFetchingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocation({ lat: latitude, lng: longitude });
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded[0]) {
        const { street, city, region } = geocoded[0];
        setLocationText([street, city, region].filter(Boolean).join(', '));
      } else {
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      setErrors((e) => ({ ...e, location: null }));
    } catch {
      Alert.alert('Location Error', 'Could not detect location.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // ─── Submit: validate → upload all images → navigate ──────────────────────
  const handleNext = async () => {
    setGlobalError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Upload all three images in parallel — only when profile is complete
      const [selfieUrl, cnicFrontUrl, cnicBackUrl] = await Promise.all([
        uploadToCloudinary(selfieImage, 'selfies'),
        uploadToCloudinary(cnicFrontImage, 'cnic'),
        uploadToCloudinary(cnicBackImage, 'cnic'),
      ]);

      navigation.navigate('OTPVerify', {
        // Use 'workerReapply' flow for rejected workers so the correct
        // API endpoint (PUT /reapply) is called instead of POST /register
        flow: isReapply ? 'workerReapply' : 'workerRegister',
        phone: form.phone.trim(),
        registrationData: {
          name: form.name.trim(),
          cnic: form.cnic.trim(),
          phone: form.phone.trim(),
          selfie_url: selfieUrl,
          cnic_front_url: cnicFrontUrl,
          cnic_back_url: cnicBackUrl,
          skills: selectedSkills,
          fee: Number(form.fee),
          location,
        },
      });
    } catch (err) {
      setGlobalError('Image upload failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Camera config based on mode
  const getCameraConfig = () => {
    switch (cameraMode) {
      case 'selfie':
        return { facing: 'front', guideType: 'face', title: 'Take your selfie', subtitle: 'Keep your face clearly visible' };
      case 'cnic_front':
        return { facing: 'back', guideType: 'document', title: 'CNIC Front Side', subtitle: 'Place your CNIC card flat and capture' };
      case 'cnic_back':
        return { facing: 'back', guideType: 'document', title: 'CNIC Back Side', subtitle: 'Place your CNIC card flat and capture' };
      default:
        return { facing: 'front', guideType: 'face', title: 'Capture', subtitle: '' };
    }
  };

  const camConfig = getCameraConfig();
  const isBusy = submitting || fetchingLocation || scanningCnic;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Live Camera Modal */}
      <LiveCameraCapture
        visible={cameraVisible}
        onCapture={handleCameraCapture}
        onClose={() => setCameraVisible(false)}
        facing={camConfig.facing}
        guideType={camConfig.guideType}
        title={camConfig.title}
        subtitle={camConfig.subtitle}
      />

      {/* CNIC Crop Modal */}
      <ImageCropModal
        visible={cropVisible}
        imageUri={cropImageUri}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
        title={cropTarget === 'cnic_front' ? 'Crop CNIC Front' : 'Crop CNIC Back'}
        aspectRatio={1.585}
      />

      {/* Full-screen upload overlay while submitting */}
      {submitting && (
        <View style={styles.submitOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.submitOverlayText}>Uploading photos…</Text>
          <Text style={styles.submitOverlayHint}>Please wait, do not close the app</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={isReapply ? 'Re-apply as Worker' : 'Worker Registration'}
            subtitle={isReapply ? 'Update your details and re-submit for review' : 'Join homiHire as a service professional'}
            onBack={() => navigation.goBack()}
          />

          {/* Re-apply notice banner */}
          {isReapply && (
            <View style={styles.reapplyBanner}>
              <Text style={styles.reapplyBannerIcon}>🔄</Text>
              <Text style={styles.reapplyBannerText}>
                You are re-applying. Update any incorrect info and submit again for admin review.
              </Text>
            </View>
          )}

          {globalError ? <ErrorMessage message={globalError} /> : null}

          {/* Worker badge */}
          <View style={styles.workerBadge}>
            <Text style={styles.workerBadgeIcon}>🔧</Text>
            <View>
              <Text style={styles.workerBadgeTitle}>Service Professional</Text>
              <Text style={styles.workerBadgeSubtitle}>Your account will be reviewed by admin before activation</Text>
            </View>
          </View>

          {/* Upload-on-submit info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🔒</Text>
            <Text style={styles.infoBannerText}>
              Photos are uploaded securely only when you complete and submit this form.
            </Text>
          </View>

          {/* ─── 1. LIVE SELFIE ──────────────────────────────────────── */}
          <SectionTitle text="LIVE SELFIE VERIFICATION" />
          {selfieImage ? (
            <View style={styles.capturedContainer}>
              <Image source={{ uri: selfieImage }} style={styles.capturedImage} />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Selfie captured (uploads on submit)</Text>
              </View>
              <TouchableOpacity onPress={handleRetakeSelfie} style={styles.retakeBtn} activeOpacity={0.8}>
                <Text style={styles.retakeBtnText}>🔄 Retake Selfie</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => openCamera('selfie')}
              style={[styles.liveCapturePicker, errors.selfie && styles.liveCapturePickerError]}
              activeOpacity={0.8}
            >
              <View style={styles.liveCaptureContent}>
                <View style={styles.cameraIconCircle}>
                  <Text style={{ fontSize: 32 }}>🤳</Text>
                </View>
                <Text style={styles.liveCaptureTitle}>Tap to take selfie</Text>
                <Text style={styles.liveCaptureHint}>Live selfie required for identity verification</Text>
                <View style={styles.liveBadgeSmall}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveLabelSmall}>LIVE DETECTION</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          {errors.selfie && <Text style={styles.fieldError}>{errors.selfie}</Text>}

          {/* ─── 2. CNIC FRONT & BACK ────────────────────────────────── */}
          <SectionTitle text="CNIC DOCUMENT PHOTOS" />
          <View style={styles.cnicRow}>
            {/* CNIC Front */}
            <View style={styles.cnicCard}>
              <Text style={styles.cnicLabel}>🪪 Front Side</Text>
              {cnicFrontImage ? (
                <View style={styles.cnicCapturedWrap}>
                  <Image source={{ uri: cnicFrontImage }} style={styles.cnicImage} />
                  <View style={styles.cnicCheck}>
                    <Text style={styles.cnicCheckText}>✓</Text>
                  </View>
                  <TouchableOpacity onPress={handleRetakeCnicFront} style={styles.cnicRetake}>
                    <Text style={styles.cnicRetakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => openCamera('cnic_front')}
                  style={[styles.cnicPlaceholder, errors.cnicFront && styles.cnicPlaceholderError]}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28 }}>📷</Text>
                  <Text style={styles.cnicPlaceholderText}>Capture</Text>
                </TouchableOpacity>
              )}
              {errors.cnicFront && <Text style={styles.cnicFieldError}>{errors.cnicFront}</Text>}
            </View>

            {/* CNIC Back */}
            <View style={styles.cnicCard}>
              <Text style={styles.cnicLabel}>🪪 Back Side</Text>
              {cnicBackImage ? (
                <View style={styles.cnicCapturedWrap}>
                  <Image source={{ uri: cnicBackImage }} style={styles.cnicImage} />
                  <View style={styles.cnicCheck}>
                    <Text style={styles.cnicCheckText}>✓</Text>
                  </View>
                  <TouchableOpacity onPress={handleRetakeCnicBack} style={styles.cnicRetake}>
                    <Text style={styles.cnicRetakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => openCamera('cnic_back')}
                  style={[styles.cnicPlaceholder, errors.cnicBack && styles.cnicPlaceholderError]}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28 }}>📷</Text>
                  <Text style={styles.cnicPlaceholderText}>Capture</Text>
                </TouchableOpacity>
              )}
              {errors.cnicBack && <Text style={styles.cnicFieldError}>{errors.cnicBack}</Text>}
            </View>
          </View>

          {/* CNIC Scanning status (OCR only — no upload) */}
          {scanningCnic && (
            <View style={styles.ocrBanner}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.ocrBannerText}>🔍 Reading CNIC info...</Text>
            </View>
          )}

          {/* Auto-detected notice */}
          {!scanningCnic && (autoDetectedFields.name || autoDetectedFields.cnic) && (
            <View style={styles.ocrSuccessBanner}>
              <Text style={styles.ocrSuccessIcon}>✨</Text>
              <Text style={styles.ocrSuccessText}>
                Auto-filled{' '}
                {[autoDetectedFields.name && 'Name', autoDetectedFields.cnic && 'CNIC'].filter(Boolean).join(' & ')}{' '}
                from your CNIC scan
              </Text>
            </View>
          )}

          {/* ─── 3. FORM FIELDS ──────────────────────────────────────── */}
          <StyledInput
            label="Full Name"
            value={form.name}
            onChangeText={(v) => { setForm((f) => ({ ...f, name: v })); setAutoDetectedFields((a) => ({ ...a, name: false })); }}
            placeholder="Usman Khan"
            maxLength={100}
            error={errors.name}
            autoDetected={autoDetectedFields.name}
          />

          <StyledInput
            label="CNIC Number"
            value={form.cnic}
            onChangeText={(v) => { setForm((f) => ({ ...f, cnic: v })); setAutoDetectedFields((a) => ({ ...a, cnic: false })); }}
            placeholder="37405-1234567-9"
            keyboardType="numeric"
            autoCapitalize="none"
            error={errors.cnic}
            autoDetected={autoDetectedFields.cnic}
          />

          <StyledInput label="Phone Number" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="03211234567" keyboardType="phone-pad" maxLength={11} autoCapitalize="none" error={errors.phone} />

          <StyledInput label="Daily Fee (PKR)" value={form.fee} onChangeText={(v) => setForm((f) => ({ ...f, fee: v }))}
            placeholder="1500" keyboardType="numeric" error={errors.fee} />

          {/* ─── 4. SKILLS ───────────────────────────────────────────── */}
          <SectionTitle text="YOUR SKILLS (select all that apply)" />
          <View style={styles.skillsGrid}>
            {SKILL_CATEGORIES.map((skill) => (
              <Tag
                key={skill.id}
                label={skill.label}
                selected={selectedSkills.includes(skill.id)}
                onPress={() => toggleSkill(skill.id)}
              />
            ))}
          </View>
          {errors.skills && <Text style={styles.fieldError}>{errors.skills}</Text>}

          {/* ─── 5. LOCATION ─────────────────────────────────────────── */}
          <SectionTitle text="YOUR LOCATION" />
          <TouchableOpacity
            onPress={detectLocation}
            style={[styles.locationBtn, location && styles.locationBtnActive, errors.location && styles.locationBtnError]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 22, marginRight: SPACING.md }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationText, location && { color: COLORS.textPrimary }]}>
                {fetchingLocation ? 'Detecting...' : location ? locationText || 'Location detected' : 'Detect my location'}
              </Text>
              {location && <Text style={styles.locationCoords}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>}
            </View>
            {location && <Text style={{ color: COLORS.success, fontSize: 20, fontWeight: '700' }}>✓</Text>}
          </TouchableOpacity>
          {errors.location && <Text style={styles.fieldError}>{errors.location}</Text>}

          <PrimaryButton
            title={submitting ? 'Uploading & Sending OTP…' : 'Send OTP & Continue'}
            onPress={handleNext}
            disabled={isBusy}
            style={{ marginTop: SPACING['3xl'] }}
          />

          <Text style={styles.disclaimer}>
            After OTP verification, your account will be reviewed by an admin. You'll receive a notification once approved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING['2xl'], paddingTop: 56, paddingBottom: SPACING['4xl'] },

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

  workerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    gap: SPACING.md,
  },
  workerBadgeIcon: { fontSize: 28 },
  workerBadgeTitle: { color: COLORS.primary, fontWeight: FONTS.bold, fontSize: FONTS.md },
  workerBadgeSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2, flex: 1 },

  // Re-apply banner (shown only when re-applying after rejection)
  reapplyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(245,166,35,0.4)',
    gap: SPACING.sm,
  },
  reapplyBannerIcon: { fontSize: 16, marginTop: 1 },
  reapplyBannerText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: FONTS.medium,
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

  // Live capture picker (before capture)
  liveCapturePicker: {
    height: 170,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245,166,35,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
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

  // ─── CNIC Cards ──────────────────────────────────────────
  cnicRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cnicCard: { flex: 1 },
  cnicLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  cnicPlaceholder: {
    height: 120,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  cnicPlaceholderError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorMuted,
  },
  cnicPlaceholderText: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
  },
  cnicCapturedWrap: {
    height: 120,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.surfaceElevated,
  },
  cnicImage: {
    width: '100%',
    height: '100%',
  },
  cnicCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cnicCheckText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cnicRetake: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  cnicRetakeText: {
    color: '#fff',
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium,
  },
  cnicFieldError: {
    color: COLORS.error,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  // CNIC OCR banners
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
  },
  ocrBannerText: {
    color: COLORS.primary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  ocrSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(72,199,142,0.3)',
  },
  ocrSuccessIcon: { fontSize: 16 },
  ocrSuccessText: {
    color: COLORS.success,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    flex: 1,
  },

  // Skills, location, etc.
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md },

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
  locationText: { color: COLORS.textSecondary, fontSize: FONTS.md, fontWeight: FONTS.medium },
  locationCoords: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },

  fieldError: { color: COLORS.error, fontSize: FONTS.xs, marginTop: -SPACING.md, marginBottom: SPACING.md, marginLeft: SPACING.xs },
  disclaimer: { color: COLORS.textMuted, fontSize: FONTS.xs, textAlign: 'center', marginTop: SPACING.xl, lineHeight: 18, paddingHorizontal: SPACING.md },
});
