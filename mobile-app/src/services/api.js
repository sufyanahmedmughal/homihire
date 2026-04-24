import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'user_role', 'user_profile']);
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints (Slice 1) ──────────────────────────────────────────────

/**
 * Register a new user after Firebase OTP verification
 */
export const registerUser = async ({ firebase_id_token, name, phone, profile_picture_url, location }) => {
  const response = await api.post('/api/auth/user/verify-firebase-token', {
    firebase_id_token,
    name,
    phone,
    profile_picture_url,
    location,
  });
  return response.data;
};

/**
 * Register a new worker after Firebase OTP verification
 */
export const registerWorker = async ({
  firebase_id_token, name, cnic, phone,
  selfie_url, cnic_front_url, cnic_back_url, skills, fee, location,
}) => {
  const response = await api.post('/api/auth/worker/verify-firebase-token', {
    firebase_id_token,
    name,
    cnic,
    phone,
    selfie_url,
    cnic_front_url,
    cnic_back_url,
    skills,
    fee,
    location,
  });
  return response.data;
};

/**
 * Re-apply as a worker after being rejected.
 * Calls PUT /api/auth/worker/reapply — updates the existing worker record
 * and resets status from 'rejected' → 'pending' for admin re-review.
 *
 * ⚠️  Backend team: implement PUT /api/auth/worker/reapply
 *   - Verify firebase_id_token to identify the worker by phone
 *   - Update all fields: name, cnic, selfie_url, cnic_front_url, cnic_back_url, skills, fee, location
 *   - Set status = 'pending', clear rejection_reason
 *   - Return { success: true, message: 'Re-application submitted successfully' }
 */
export const reapplyWorker = async ({
  firebase_id_token, name, cnic, phone,
  selfie_url, cnic_front_url, cnic_back_url, skills, fee, location,
}) => {
  const response = await api.put('/api/auth/worker/reapply', {
    firebase_id_token,
    name,
    cnic,
    phone,
    selfie_url,
    cnic_front_url,
    cnic_back_url,
    skills,
    fee,
    location,
  });
  return response.data;
};

/**
 * Login — user or worker (role detected from DB)
 */
export const loginWithFirebase = async ({ firebase_id_token, phone }) => {
  const response = await api.post('/api/auth/login', {
    firebase_id_token,
    phone,
  });
  return response.data;
};

/**
 * Admin login (email + password)
 */
export const adminLogin = async ({ email, password }) => {
  const response = await api.post('/api/auth/admin/login', { email, password });
  return response.data;
};

/**
 * Get current user/worker profile
 */
export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// ─── Cloudinary Upload ─────────────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwcoeg1o8';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'homihire_mobile';

/**
 * Upload image to Cloudinary directly from mobile
 * @param {string} imageUri  - Local file URI from expo-image-picker
 * @param {string} folder    - Cloudinary folder: 'avatars' | 'selfies'
 */
export const uploadToCloudinary = async (imageUri, folder = 'avatars') => {
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename ?? '');
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: imageUri, name: filename, type });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  console.log('[Cloudinary] Uploading to cloud:', CLOUDINARY_CLOUD_NAME);
  console.log('[Cloudinary] Using preset:', CLOUDINARY_UPLOAD_PRESET);
  console.log('[Cloudinary] File:', filename, 'Type:', type);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    console.log('[Cloudinary] Upload success:', response.data.secure_url);
    return response.data.secure_url;
  } catch (err) {
    const errorMsg = err?.response?.data?.error?.message || err?.message || 'Unknown error';
    console.error('[Cloudinary] Upload FAILED:', errorMsg);
    console.error('[Cloudinary] Status:', err?.response?.status);
    console.error('[Cloudinary] Full error:', JSON.stringify(err?.response?.data));
    throw err;
  }
};


/**
 * Register FCM push token for the currently logged-in worker.
 * Backend: PUT /api/auth/worker/update-fcm-token
 * Body: { fcm_token: string }
 */
export const updateFcmToken = async (fcmToken) => {
  const response = await api.put('/api/auth/worker/update-fcm-token', {
    fcm_token: fcmToken,
  });
  return response.data;
};

export default api;

