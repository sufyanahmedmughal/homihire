/**
 * CNIC OCR Service
 *
 * Uses OCR.space free API to extract text from a scanned Pakistan CNIC image.
 * Parses the detected text to auto-fill Name and CNIC Number fields.
 *
 * OCR.space free tier: https://ocr.space/OCRAPI
 * Free API key: 'helloworld'  (limited — get a free key at ocr.space for production)
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || 'helloworld';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Run OCR on a CNIC image and return extracted name + cnic number.
 *
 * @param {string} imageUri  – local file URI from expo-camera
 * @returns {{ name: string|null, cnic: string|null }} – extracted fields (null if not found)
 */
export const extractCNICData = async (imageUri) => {
  try {
    // Compress image to ensure it's under 1MB for free OCR API
    const manipResult = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }], // Resize to smaller width
      { compress: 0.7, format: SaveFormat.JPEG, base64: true }
    );

    // Get the base64 string directly from the manipulator result
    const base64 = manipResult.base64;

    // Build multipart form-data body
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
    formData.append('language', 'eng');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'false');
    formData.append('OCREngine', '2'); // Engine 2 handles printed text well

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: { apikey: OCR_API_KEY },
      body: formData,
    });

    if (!response.ok) {
      console.warn('[CNIC OCR] HTTP error:', response.status);
      return { name: null, cnic: null };
    }

    const result = await response.json();

    if (
      result.IsErroredOnProcessing ||
      !result.ParsedResults ||
      result.ParsedResults.length === 0
    ) {
      console.warn('[CNIC OCR] No parsed results:', result.ErrorMessage);
      return { name: null, cnic: null };
    }

    const rawText = result.ParsedResults[0].ParsedText || '';
    console.log('[CNIC OCR] Raw text:\n', rawText);

    return parseCNICText(rawText);
  } catch (err) {
    console.error('[CNIC OCR] Error:', err.message);
    return { name: null, cnic: null };
  }
};

/**
 * Parse raw OCR text from a Pakistan CNIC card.
 *
 * CNIC front side layout (English):
 *   Name: MUHAMMAD ALI
 *   Father Name: ...
 *   CNIC No.:  35202-1234567-9
 *   Date of Birth: ...
 */
const parseCNICText = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let name = null;
  let cnic = null;

  // ── CNIC number ──────────────────────────────────────────────
  // Standard format: 35202-1234567-9   also handles OCR noise like spaces or missing dashes
  const cnicPattern = /\b(\d{5})[-\s]*(\d{7})[-\s]*(\d)\b/;
  for (const line of lines) {
    const m = line.match(cnicPattern);
    if (m) {
      cnic = `${m[1]}-${m[2]}-${m[3]}`;
      break;
    }
  }

  // ── Name ─────────────────────────────────────────────────────
  // Try "Name:" / "Name :" label approach first. Sometimes the name is on the next line.
  const nameLabelPattern = /^(?:Name|Nam|Nane)\s*[:\-]?\s*(.*)$/i;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(nameLabelPattern);
    if (m) {
      let candidate = m[1].trim();

      // If text after "Name:" is too short or empty, the actual name is likely on the next line
      if (candidate.length < 3 && i + 1 < lines.length) {
        candidate = lines[i + 1].trim();
      }

      // Must be at least 3 chars, contain letters, and not be a skip-word like Father Name
      if (
        candidate.length >= 3 && 
        /[a-zA-Z]/.test(candidate) && 
        !/father|husband/i.test(candidate)
      ) {
        name = toTitleCase(candidate);
        break;
      }
    }
  }

  // Fallback: find longest line that looks like a name
  if (!name) {
    const skipWords = [
      'REPUBLIC', 'PAKISTAN', 'NATIONAL', 'IDENTITY', 'CARD', 'CNIC',
      'COMPUTERIZED', 'FATHER', 'HUSBAND', 'NAME', 'DATE', 'BIRTH',
      'GENDER', 'MALE', 'FEMALE', 'ISSUE', 'EXPIRY', 'SIGNATURE',
      'GOVERNMENT', 'PROVINCE', 'COUNTRY'
    ];
    let best = '';
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      // Letters, spaces, maybe dots (like M. Ali), no digits
      if (
        /^[a-zA-Z\s\.]+$/.test(line) &&
        /\s/.test(line.trim()) && // at least 2 words
        !/\d/.test(line) &&
        !skipWords.some((w) => upperLine.includes(w)) &&
        line.length > best.length
      ) {
        best = line;
      }
    }
    if (best.length >= 5) {
      name = toTitleCase(best);
    }
  }

  console.log('[CNIC OCR] Extracted → name:', name, '| cnic:', cnic);
  return { name, cnic };
};

const toTitleCase = (str) =>
  str
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
