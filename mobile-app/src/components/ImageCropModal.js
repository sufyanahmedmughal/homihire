import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image,
  Dimensions, PanResponder, ActivityIndicator, Platform,
} from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTAINER_H = SCREEN_HEIGHT * 0.6;

const MIN_CROP_SIZE = 80;
const HANDLE_SIZE = 28;
const HANDLE_HIT = 40;

export default function ImageCropModal({
  visible,
  imageUri,
  onCrop,
  onCancel,
  title = 'Crop Image',
  aspectRatio = null,
}) {
  const [normalizedUri, setNormalizedUri] = useState(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [ready, setReady] = useState(false);
  const [cropping, setCropping] = useState(false);

  // Rendered image bounds within the container
  const [rendered, setRendered] = useState({ w: 0, h: 0, offsetX: 0, offsetY: 0 });

  // Crop rect in container coordinates
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ── Refs for PanResponder ──
  const cropRectRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const renderedRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const activeHandle = useRef(null);
  const startCrop = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const wrapperRef = useRef(null);
  const wrapperPagePos = useRef({ x: 0, y: 0 });

  useEffect(() => { cropRectRef.current = cropRect; }, [cropRect]);
  useEffect(() => { renderedRef.current = rendered; }, [rendered]);

  // ── Step 1: Normalize the image (bake EXIF rotation) and get true dimensions ──
  useEffect(() => {
    if (!visible || !imageUri) {
      setNormalizedUri(null);
      setReady(false);
      setNaturalW(0);
      setNaturalH(0);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // manipulateAsync with empty actions normalizes EXIF rotation
        // The returned width/height will be the ACTUAL displayed dimensions
        const result = await manipulateAsync(
          imageUri,
          [], // no transforms — just normalize
          { format: SaveFormat.JPEG, compress: 0.9 },
        );

        if (cancelled) return;

        console.log('[ImageCrop] Normalized:', result.width, 'x', result.height);
        setNormalizedUri(result.uri);
        setNaturalW(result.width);
        setNaturalH(result.height);

        // Compute rendered bounds
        const imgAspect = result.width / result.height;
        const ctrAspect = SCREEN_WIDTH / CONTAINER_H;

        let rW, rH, oX, oY;
        if (imgAspect > ctrAspect) {
          rW = SCREEN_WIDTH;
          rH = SCREEN_WIDTH / imgAspect;
          oX = 0;
          oY = (CONTAINER_H - rH) / 2;
        } else {
          rH = CONTAINER_H;
          rW = CONTAINER_H * imgAspect;
          oX = (SCREEN_WIDTH - rW) / 2;
          oY = 0;
        }

        const r = { w: rW, h: rH, offsetX: oX, offsetY: oY };
        setRendered(r);
        renderedRef.current = r;

        // Initial crop: 80% of rendered image, centered
        let cropW = rW * 0.8;
        let cropH = rH * 0.8;

        if (aspectRatio) {
          const maxW = rW * 0.85;
          const maxH = rH * 0.85;
          if (maxW / aspectRatio <= maxH) {
            cropW = maxW;
            cropH = maxW / aspectRatio;
          } else {
            cropH = maxH;
            cropW = maxH * aspectRatio;
          }
        }

        const cx = oX + (rW - cropW) / 2;
        const cy = oY + (rH - cropH) / 2;
        const initial = { x: cx, y: cy, w: cropW, h: cropH };
        setCropRect(initial);
        cropRectRef.current = initial;

        setReady(true);

        console.log('[ImageCrop] Rendered:', JSON.stringify(r));
        console.log('[ImageCrop] Initial crop:', JSON.stringify(initial));
      } catch (err) {
        console.error('[ImageCrop] Normalize error:', err);
        if (!cancelled) onCancel?.();
      }
    })();

    return () => { cancelled = true; };
  }, [visible, imageUri, aspectRatio]);

  // Measure wrapper position after it renders
  useEffect(() => {
    if (ready && wrapperRef.current) {
      setTimeout(() => {
        wrapperRef.current?.measureInWindow((px, py) => {
          wrapperPagePos.current = { x: px || 0, y: py || 0 };
        });
      }, 200);
    }
  }, [ready]);

  // ── PanResponder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const r = renderedRef.current;
        if (!r || !r.w) return;

        const touchX = evt.nativeEvent.pageX - wrapperPagePos.current.x;
        const touchY = evt.nativeEvent.pageY - wrapperPagePos.current.y;

        const cr = cropRectRef.current;
        startCrop.current = { ...cr };

        const nearLeft = Math.abs(touchX - cr.x) < HANDLE_HIT;
        const nearRight = Math.abs(touchX - (cr.x + cr.w)) < HANDLE_HIT;
        const nearTop = Math.abs(touchY - cr.y) < HANDLE_HIT;
        const nearBottom = Math.abs(touchY - (cr.y + cr.h)) < HANDLE_HIT;

        if (nearTop && nearLeft) activeHandle.current = 'tl';
        else if (nearTop && nearRight) activeHandle.current = 'tr';
        else if (nearBottom && nearLeft) activeHandle.current = 'bl';
        else if (nearBottom && nearRight) activeHandle.current = 'br';
        else if (touchX > cr.x && touchX < cr.x + cr.w && touchY > cr.y && touchY < cr.y + cr.h) {
          activeHandle.current = 'move';
        } else {
          activeHandle.current = null;
        }
      },
      onPanResponderMove: (evt, gs) => {
        if (!activeHandle.current) return;
        const r = renderedRef.current;
        if (!r || !r.w) return;

        const sc = startCrop.current;
        const dx = gs.dx;
        const dy = gs.dy;

        const minX = r.offsetX;
        const minY = r.offsetY;
        const maxX = r.offsetX + r.w;
        const maxY = r.offsetY + r.h;

        let newRect = { ...sc };

        switch (activeHandle.current) {
          case 'move': {
            newRect.x = Math.max(minX, Math.min(sc.x + dx, maxX - sc.w));
            newRect.y = Math.max(minY, Math.min(sc.y + dy, maxY - sc.h));
            break;
          }
          case 'tl': {
            let nw = sc.w - dx, nh = aspectRatio ? 0 : sc.h - dy;
            nw = Math.max(MIN_CROP_SIZE, nw);
            nh = aspectRatio ? nw / aspectRatio : Math.max(MIN_CROP_SIZE, nh);
            let nx = sc.x + sc.w - nw, ny = sc.y + sc.h - nh;
            if (nx < minX) { nw = sc.x + sc.w - minX; nx = minX; if (aspectRatio) { nh = nw / aspectRatio; ny = sc.y + sc.h - nh; } }
            if (ny < minY) { nh = sc.y + sc.h - minY; ny = minY; if (aspectRatio) { nw = nh * aspectRatio; nx = sc.x + sc.w - nw; } }
            newRect = { x: nx, y: ny, w: nw, h: nh };
            break;
          }
          case 'tr': {
            let nw = sc.w + dx, nh = aspectRatio ? 0 : sc.h - dy;
            nw = Math.max(MIN_CROP_SIZE, nw);
            nh = aspectRatio ? nw / aspectRatio : Math.max(MIN_CROP_SIZE, nh);
            let ny = sc.y + sc.h - nh;
            if (sc.x + nw > maxX) { nw = maxX - sc.x; if (aspectRatio) { nh = nw / aspectRatio; ny = sc.y + sc.h - nh; } }
            if (ny < minY) { nh = sc.y + sc.h - minY; ny = minY; if (aspectRatio) nw = nh * aspectRatio; }
            newRect = { x: sc.x, y: ny, w: nw, h: nh };
            break;
          }
          case 'bl': {
            let nw = sc.w - dx, nh = aspectRatio ? 0 : sc.h + dy;
            nw = Math.max(MIN_CROP_SIZE, nw);
            nh = aspectRatio ? nw / aspectRatio : Math.max(MIN_CROP_SIZE, nh);
            let nx = sc.x + sc.w - nw;
            if (nx < minX) { nw = sc.x + sc.w - minX; nx = minX; if (aspectRatio) nh = nw / aspectRatio; }
            if (sc.y + nh > maxY) { nh = maxY - sc.y; if (aspectRatio) { nw = nh * aspectRatio; nx = sc.x + sc.w - nw; } }
            newRect = { x: nx, y: sc.y, w: nw, h: nh };
            break;
          }
          case 'br': {
            let nw = sc.w + dx, nh = aspectRatio ? 0 : sc.h + dy;
            nw = Math.max(MIN_CROP_SIZE, nw);
            nh = aspectRatio ? nw / aspectRatio : Math.max(MIN_CROP_SIZE, nh);
            if (sc.x + nw > maxX) { nw = maxX - sc.x; if (aspectRatio) nh = nw / aspectRatio; }
            if (sc.y + nh > maxY) { nh = maxY - sc.y; if (aspectRatio) nw = nh * aspectRatio; }
            newRect = { x: sc.x, y: sc.y, w: nw, h: nh };
            break;
          }
        }

        cropRectRef.current = newRect;
        setCropRect({ ...newRect });
      },
      onPanResponderRelease: () => { activeHandle.current = null; },
    })
  ).current;

  // ── Apply crop using the NORMALIZED image ──
  const handleCrop = async () => {
    const r = renderedRef.current;
    if (!r || !r.w || !normalizedUri || !naturalW) return;
    setCropping(true);
    try {
      // Convert crop rect from container coords to image coords
      // 1. Get position relative to rendered image top-left
      const relX = cropRectRef.current.x - r.offsetX;
      const relY = cropRectRef.current.y - r.offsetY;

      // 2. Convert to 0-1 ratios within the rendered image
      const ratioX = relX / r.w;
      const ratioY = relY / r.h;
      const ratioW = cropRectRef.current.w / r.w;
      const ratioH = cropRectRef.current.h / r.h;

      // 3. Apply ratios to natural dimensions
      let originX = Math.round(ratioX * naturalW);
      let originY = Math.round(ratioY * naturalH);
      let width = Math.round(ratioW * naturalW);
      let height = Math.round(ratioH * naturalH);

      // Clamp
      originX = Math.max(0, originX);
      originY = Math.max(0, originY);
      if (originX + width > naturalW) width = naturalW - originX;
      if (originY + height > naturalH) height = naturalH - originY;
      if (width < 10) width = 10;
      if (height < 10) height = 10;

      console.log('[ImageCrop] Crop ratios:', { ratioX: ratioX.toFixed(3), ratioY: ratioY.toFixed(3), ratioW: ratioW.toFixed(3), ratioH: ratioH.toFixed(3) });
      console.log('[ImageCrop] Crop pixels:', { originX, originY, width, height, naturalW, naturalH });

      // Crop the NORMALIZED image (EXIF already baked in)
      const result = await manipulateAsync(
        normalizedUri,
        [{ crop: { originX, originY, width, height } }],
        { format: SaveFormat.JPEG, compress: 0.85 },
      );

      console.log('[ImageCrop] Result:', result.width, 'x', result.height);
      onCrop(result.uri);
    } catch (err) {
      console.error('[ImageCrop] Crop error:', err);
      onCrop(normalizedUri || imageUri);
    } finally {
      setCropping(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>Drag corners to adjust crop area</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Image + crop overlay */}
        <View style={styles.imageContainer}>
          {!ready ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Preparing image...</Text>
            </View>
          ) : (
            <View
              ref={wrapperRef}
              style={styles.imageWrapper}
              {...panResponder.panHandlers}
            >
              <Image
                source={{ uri: normalizedUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              {/* Dim overlays */}
              <View style={[styles.dimOverlay, {
                top: 0, left: 0, right: 0,
                height: Math.max(0, cropRect.y),
              }]} />
              <View style={[styles.dimOverlay, {
                top: cropRect.y + cropRect.h, left: 0, right: 0,
                bottom: 0,
              }]} />
              <View style={[styles.dimOverlay, {
                top: cropRect.y, left: 0,
                width: Math.max(0, cropRect.x),
                height: cropRect.h,
              }]} />
              <View style={[styles.dimOverlay, {
                top: cropRect.y, left: cropRect.x + cropRect.w,
                right: 0,
                height: cropRect.h,
              }]} />

              {/* Crop border */}
              <View style={[styles.cropBorder, {
                left: cropRect.x, top: cropRect.y,
                width: cropRect.w, height: cropRect.h,
              }]} pointerEvents="none">
                <View style={[styles.gridLine, styles.gridH, { top: '33.33%' }]} />
                <View style={[styles.gridLine, styles.gridH, { top: '66.66%' }]} />
                <View style={[styles.gridLine, styles.gridV, { left: '33.33%' }]} />
                <View style={[styles.gridLine, styles.gridV, { left: '66.66%' }]} />
              </View>

              {/* Corner handles */}
              {[
                { x: cropRect.x, y: cropRect.y, s: styles.hTL },
                { x: cropRect.x + cropRect.w, y: cropRect.y, s: styles.hTR },
                { x: cropRect.x, y: cropRect.y + cropRect.h, s: styles.hBL },
                { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h, s: styles.hBR },
              ].map((h, i) => (
                <View key={i} style={[styles.handle, {
                  left: h.x - HANDLE_SIZE / 2,
                  top: h.y - HANDLE_SIZE / 2,
                }]} pointerEvents="none">
                  <View style={[styles.handleInner, h.s]} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Skip Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCrop}
            style={[styles.cropBtn, (cropping || !ready) && styles.cropBtnDisabled]}
            activeOpacity={0.7}
            disabled={cropping || !ready}
          >
            {cropping ? (
              <ActivityIndicator color={COLORS.textInverse} size="small" />
            ) : (
              <>
                <Text style={styles.cropBtnIcon}>✂️</Text>
                <Text style={styles.cropBtnText}>Crop & Use</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    backgroundColor: 'rgba(10,10,15,0.95)',
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  headerBtnText: { color: '#fff', fontSize: 18, fontWeight: FONTS.semibold },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: FONTS.lg, fontWeight: FONTS.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: FONTS.xs, marginTop: 2 },
  imageContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
  loadingWrap: { alignItems: 'center', gap: SPACING.lg },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sm },
  imageWrapper: {
    width: SCREEN_WIDTH, height: CONTAINER_H, position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  dimOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBorder: {
    position: 'absolute', borderWidth: 2, borderColor: COLORS.primary, borderRadius: 2,
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(245,166,35,0.25)' },
  gridH: { left: 0, right: 0, height: 1 },
  gridV: { top: 0, bottom: 0, width: 1 },
  handle: {
    position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  handleInner: { position: 'absolute', borderColor: COLORS.primary },
  hTL: {
    width: 20, height: 20, top: HANDLE_SIZE / 2 - 2, left: HANDLE_SIZE / 2 - 2,
    borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 4,
  },
  hTR: {
    width: 20, height: 20, top: HANDLE_SIZE / 2 - 2, right: HANDLE_SIZE / 2 - 2,
    borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 4,
  },
  hBL: {
    width: 20, height: 20, bottom: HANDLE_SIZE / 2 - 2, left: HANDLE_SIZE / 2 - 2,
    borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 4,
  },
  hBR: {
    width: 20, height: 20, bottom: HANDLE_SIZE / 2 - 2, right: HANDLE_SIZE / 2 - 2,
    borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 4,
  },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING['2xl'], paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: SPACING.xl, backgroundColor: 'rgba(10,10,15,0.95)', gap: SPACING.lg,
  },
  cancelBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.md, fontWeight: FONTS.semibold },
  cropBtn: {
    flex: 1.5, flexDirection: 'row', paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    ...SHADOWS.glow,
  },
  cropBtnDisabled: { opacity: 0.6 },
  cropBtnIcon: { fontSize: 18 },
  cropBtnText: { color: COLORS.textInverse, fontSize: FONTS.md, fontWeight: FONTS.bold },
});
