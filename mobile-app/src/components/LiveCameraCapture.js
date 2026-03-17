import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    Animated, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FACE_GUIDE_SIZE = SCREEN_WIDTH * 0.65;
const DOC_GUIDE_WIDTH = SCREEN_WIDTH * 0.85;
const DOC_GUIDE_HEIGHT = DOC_GUIDE_WIDTH * 0.63; // ID card aspect ratio

/**
 * LiveCameraCapture
 * 
 * A full-screen modal camera component with a face-guide overlay.
 * Opens the front camera, shows a live preview with a face outline,
 * and captures a photo when the user taps the shutter button.
 * 
 * Props:
 *   visible    – boolean to control modal visibility
 *   onCapture  – (uri: string) => void — called with the captured photo URI
 *   onClose    – () => void — called when user dismisses
 *   facing     – 'front' | 'back' (default: 'front')
 *   guideType  – 'face' | 'document' | 'none' (default: 'face')
 *   title      – string header text (default: 'Position your face')
 *   subtitle   – string hint text
 */
export default function LiveCameraCapture({
    visible,
    onCapture,
    onClose,
    facing = 'front',
    guideType = 'face',
    title = 'Position your face',
    subtitle = 'Keep your face inside the guide',
}) {
    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const cameraRef = useRef(null);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Pulse guide ring
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.06,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Scanning line animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            fadeAnim.setValue(0);
            setCameraReady(false);
        }
    }, [visible]);

    const handleCapture = async () => {
        if (!cameraRef.current || capturing || !cameraReady) return;

        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: false,
            });
            if (photo?.uri) {
                onCapture(photo.uri);
            }
        } catch (err) {
            console.error('[LiveCamera] Capture error:', err);
        } finally {
            setCapturing(false);
        }
    };

    const renderPermissionRequest = () => (
        <View style={styles.permissionContainer}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSubtitle}>
                We need camera access to capture your live photo for verification
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permissionCancelBtn} onPress={onClose}>
                <Text style={styles.permissionCancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    // Dynamic guide dimensions based on mode
    const guideWidth = guideType === 'document' ? DOC_GUIDE_WIDTH : FACE_GUIDE_SIZE;
    const guideHeight = guideType === 'document' ? DOC_GUIDE_HEIGHT : FACE_GUIDE_SIZE;

    const scanTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-guideHeight / 2 + 10, guideHeight / 2 - 10],
    });

    const guideTop = (SCREEN_HEIGHT - guideHeight) / 2 - 60;
    const sideWidth = (SCREEN_WIDTH - guideWidth) / 2;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
        >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {/* Handle permissions */}
                {!permission?.granted ? (
                    renderPermissionRequest()
                ) : (
                    <>
                        {/* Camera Preview */}
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            facing={facing}
                            onCameraReady={() => setCameraReady(true)}
                        />

                        {/* Dark overlay with cutout */}
                        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                            {/* Top overlay */}
                            <View style={[styles.overlayPart, { height: guideTop }]} />

                            {/* Middle row */}
                            <View style={{ flexDirection: 'row', height: guideHeight }}>
                                <View style={[styles.overlayPart, { width: sideWidth }]} />

                                {/* Guide cutout area */}
                                <View style={{ width: guideWidth, height: guideHeight, alignItems: 'center', justifyContent: 'center' }}>
                                    <Animated.View
                                        style={[
                                            {
                                                width: guideWidth - 8,
                                                height: guideHeight - 8,
                                                borderRadius: guideType === 'face' ? (FACE_GUIDE_SIZE - 8) / 2 : 16,
                                                borderWidth: 2,
                                                borderColor: 'rgba(245, 166, 35, 0.5)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            },
                                            { transform: [{ scale: pulseAnim }] },
                                        ]}
                                    >
                                        {/* Corner brackets */}
                                        <View style={[styles.cornerBracket, styles.cornerTL]} />
                                        <View style={[styles.cornerBracket, styles.cornerTR]} />
                                        <View style={[styles.cornerBracket, styles.cornerBL]} />
                                        <View style={[styles.cornerBracket, styles.cornerBR]} />

                                        {/* Scanning line */}
                                        <Animated.View
                                            style={[
                                                styles.scanLine,
                                                { transform: [{ translateY: scanTranslateY }] },
                                            ]}
                                        />
                                    </Animated.View>
                                </View>

                                <View style={[styles.overlayPart, { width: sideWidth }]} />
                            </View>

                            {/* Bottom overlay */}
                            <View style={[styles.overlayPart, { flex: 1 }]} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>

                            <View style={styles.headerCenter}>
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            </View>

                            <View style={{ width: 44 }} />
                        </View>

                        {/* Instructions */}
                        <View style={[styles.instructions, { top: guideTop - 70 }]}>
                            <Text style={styles.instructionTitle}>{title}</Text>
                            <Text style={styles.instructionSubtitle}>{subtitle}</Text>
                        </View>

                        {/* Bottom controls */}
                        <View style={styles.controls}>
                            {/* Status indicator */}
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, cameraReady && styles.statusDotReady]} />
                                <Text style={styles.statusText}>
                                    {cameraReady ? 'Camera ready' : 'Initializing...'}
                                </Text>
                            </View>

                            {/* Capture button */}
                            <TouchableOpacity
                                onPress={handleCapture}
                                disabled={capturing || !cameraReady}
                                activeOpacity={0.7}
                                style={styles.captureOuter}
                            >
                                <View style={[
                                    styles.captureInner,
                                    (!cameraReady || capturing) && styles.captureDisabled,
                                ]}>
                                    {capturing ? (
                                        <ActivityIndicator color={COLORS.textInverse} size="small" />
                                    ) : (
                                        <View style={styles.captureIcon} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            <Text style={styles.captureHint}>
                                {capturing ? 'Capturing...' : 'Tap to capture'}
                            </Text>
                        </View>
                    </>
                )}
            </Animated.View>
        </Modal>
    );
}

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.65)';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // Permission screen
    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING['3xl'],
    },
    permissionIcon: {
        fontSize: 56,
        marginBottom: SPACING.xl,
    },
    permissionTitle: {
        color: COLORS.textPrimary,
        fontSize: FONTS['2xl'],
        fontWeight: FONTS.bold,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    permissionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: FONTS.md,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING['3xl'],
    },
    permissionBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING['3xl'],
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.lg,
        ...SHADOWS.glow,
    },
    permissionBtnText: {
        color: COLORS.textInverse,
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
    },
    permissionCancelBtn: {
        paddingVertical: SPACING.md,
    },
    permissionCancelText: {
        color: COLORS.textMuted,
        fontSize: FONTS.md,
    },

    // Overlay
    overlayPart: {
        backgroundColor: OVERLAY_COLOR,
    },

    // Corner brackets
    cornerBracket: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: COLORS.primary,
    },
    cornerTL: {
        top: -1,
        left: -1,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 14,
    },
    cornerTR: {
        top: -1,
        right: -1,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 14,
    },
    cornerBL: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 14,
    },
    cornerBR: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 14,
    },

    // Scanning line
    scanLine: {
        position: 'absolute',
        left: 10,
        right: 10,
        height: 2,
        backgroundColor: COLORS.primary,
        opacity: 0.4,
        borderRadius: 1,
    },

    // Header
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: FONTS.semibold,
    },
    headerCenter: {
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(224, 82, 82, 0.85)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.full,
        gap: 6,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    liveText: {
        color: '#fff',
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        letterSpacing: 1.5,
    },

    // Instructions
    instructions: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    instructionTitle: {
        color: '#fff',
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    },
    instructionSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: FONTS.sm,
        marginTop: SPACING.xs,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // Controls
    controls: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 36,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.textMuted,
    },
    statusDotReady: {
        backgroundColor: COLORS.success,
    },
    statusText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: FONTS.xs,
        fontWeight: FONTS.medium,
    },

    // Capture button
    captureOuter: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    captureInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.glow,
    },
    captureDisabled: {
        backgroundColor: '#3A3A48',
    },
    captureIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    captureHint: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
    },
});
