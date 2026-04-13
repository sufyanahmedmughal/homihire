const User = require('../models/User');
const { Worker } = require('../models/Worker');
const Admin = require('../models/Admin');
const PhoneVerification = require('../models/PhoneVerification');
const { generateToken } = require('../utils/jwt');
const {
    verifyFirebaseToken,
    convertFirebasePhoneToPakistani,
} = require('../utils/otp');
const {
    isValidPhone,
    isValidCNIC,
    isValidName,
    isValidFee,
    isValidCoordinates,
    isValidSkills,
    isValidCloudinaryUrl,
} = require('../utils/validators');
const { logAuthEvent } = require('../config/logger');

// ─────────────────────────────────────────────────────────────────────
// USER REGISTRATION — Firebase Phone Auth Flow (v3 spec Section 1.4)
//
// POST /api/auth/user/verify-firebase-token
//
// FLOW:
//   1. Client uploads profile picture to Cloudinary → gets URL
//   2. Client calls Firebase signInWithPhoneNumber → user enters OTP
//   3. Firebase confirms → client gets firebase_id_token
//   4. Client sends: { firebase_id_token, name, phone, profile_picture_url, location }
//   5. Backend verifies Firebase token → creates PhoneVerification record → creates User → issues JWT
//
// NOTE: No file upload here — client sends a Cloudinary URL, not a file.
// ─────────────────────────────────────────────────────────────────────
const verifyUserFirebaseToken = async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress;
    try {
        const { firebase_id_token, name, phone, profile_picture_url, location } = req.body;

        // ── Input validation ───────────────────────────────────────
        const errors = [];
        if (!firebase_id_token) errors.push('firebase_id_token is required');
        if (!isValidName(name)) errors.push('Name must be 3-100 characters (letters, spaces, dots only)');
        if (!isValidPhone(phone)) errors.push('Phone must be a valid Pakistani number (e.g. 03001234567)');
        if (!location || typeof location.lat === 'undefined' || typeof location.lng === 'undefined') {
            errors.push('Location with lat and lng is required');
        } else if (!isValidCoordinates(Number(location.lat), Number(location.lng))) {
            errors.push('Invalid location coordinates');
        }
        if (profile_picture_url && !isValidCloudinaryUrl(profile_picture_url)) {
            errors.push('profile_picture_url must be a valid Cloudinary URL');
        }
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        // ── Verify Firebase ID Token ───────────────────────────────
        let decoded;
        try {
            decoded = await verifyFirebaseToken(firebase_id_token);
        } catch (err) {
            logAuthEvent({ phone, action: 'register', ip, status: 'fail', role: 'user', details: err.message });
            return res.status(401).json({ success: false, message: err.message });
        }

        // ── Match phone numbers ────────────────────────────────────
        // Firebase returns +923001234567 — convert to 03001234567
        const firebasePhone = convertFirebasePhoneToPakistani(decoded.phone_number);
        if (firebasePhone !== phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number mismatch. The verified number does not match the phone provided.',
            });
        }

        // ── Check phone already registered ─────────────────────────
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Phone already registered. Please login.',
            });
        }

        // ── Create PhoneVerification record (spam prevention) ──────
        // v3 spec Step 5: must exist BEFORE creating User document
        await PhoneVerification.create({
            phone,
            role: 'user',
            firebase_uid: decoded.uid,
        });

        // ── Create User document ───────────────────────────────────
        const user = await User.create({
            name: name.trim(),
            phone,
            firebase_uid: decoded.uid,
            firebase_phone_verified: true,
            profile_picture: profile_picture_url || null,
            location: {
                type: 'Point',
                coordinates: [Number(location.lng), Number(location.lat)],
            },
            status: 'active',
        });

        // ── Cleanup PhoneVerification record ───────────────────────
        await PhoneVerification.deleteOne({ phone });

        // ── Issue JWT ──────────────────────────────────────────────
        const token = generateToken({ id: user._id, role: 'user' });

        logAuthEvent({ user_id: user._id, phone, action: 'register', ip, status: 'success', role: 'user' });

        res.status(201).json({
            success: true,
            token,
            role: 'user',
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                status: user.status,
                profile_picture: user.profile_picture,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Phone already registered. Please login.',
            });
        }
        console.error('[verifyUserFirebaseToken]', error.message);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// WORKER REGISTRATION — Firebase Phone Auth Flow (v3 spec Section 1.4)
//
// POST /api/auth/worker/verify-firebase-token
//
// NOTE: Worker status stays 'pending' after registration — no JWT.
//       Worker can only login after admin approves (Slice 2).
// ─────────────────────────────────────────────────────────────────────
const verifyWorkerFirebaseToken = async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress;
    try {
        let { firebase_id_token, name, cnic, phone, selfie_url, cnic_front_url, cnic_back_url, skills, fee, location } = req.body;

        // Parse skills if sent as JSON string (e.g. from form-data)
        if (typeof skills === 'string') {
            try { skills = JSON.parse(skills); } catch { skills = [skills]; }
        }

        // ── Input validation ───────────────────────────────────────
        const errors = [];
        if (!firebase_id_token) errors.push('firebase_id_token is required');
        if (!isValidName(name)) errors.push('Name must be 3-100 characters (letters, spaces, dots only)');
        if (!isValidCNIC(cnic)) errors.push('CNIC must be in format: XXXXX-XXXXXXX-X');
        if (!isValidPhone(phone)) errors.push('Phone must be a valid Pakistani number (e.g. 03001234567)');
        if (!isValidSkills(skills)) errors.push('Skills must be valid categories: Cleaning, Plumbing, Electrical, Carpentry, Building / Construction, Repairing / Maintenance');
        if (!isValidFee(fee)) errors.push('Fee must be between 100 and 999,999 PKR');
        if (!location || typeof location.lat === 'undefined') errors.push('Location with lat and lng is required');
        else if (!isValidCoordinates(Number(location.lat), Number(location.lng))) errors.push('Invalid location coordinates');
        if (selfie_url && !isValidCloudinaryUrl(selfie_url)) errors.push('selfie_url must be a valid Cloudinary URL');
        if (cnic_front_url && !isValidCloudinaryUrl(cnic_front_url)) errors.push('cnic_front_url must be a valid Cloudinary URL');
        if (cnic_back_url && !isValidCloudinaryUrl(cnic_back_url)) errors.push('cnic_back_url must be a valid Cloudinary URL');

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        // ── Verify Firebase ID Token ───────────────────────────────
        let decoded;
        try {
            decoded = await verifyFirebaseToken(firebase_id_token);
        } catch (err) {
            logAuthEvent({ phone, action: 'register', ip, status: 'fail', role: 'worker', details: err.message });
            return res.status(401).json({ success: false, message: err.message });
        }

        // ── Match phone numbers ────────────────────────────────────
        const firebasePhone = convertFirebasePhoneToPakistani(decoded.phone_number);
        if (firebasePhone !== phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number mismatch. The verified number does not match the phone provided.',
            });
        }

        // ── Check phone already registered in Users OR Workers ─────
        const [existingUser, existingWorker] = await Promise.all([
            User.findOne({ phone }),
            Worker.findOne({ phone }),
        ]);
        if (existingUser || existingWorker) {
            return res.status(409).json({
                success: false,
                message: 'Phone already registered.',
            });
        }

        // ── Check CNIC uniqueness ──────────────────────────────────
        const existingByCNIC = await Worker.findOne({ cnic });
        if (existingByCNIC) {
            return res.status(409).json({
                success: false,
                message: 'A worker with this CNIC is already registered.',
            });
        }

        // ── Create PhoneVerification record ────────────────────────
        await PhoneVerification.create({
            phone,
            role: 'worker',
            firebase_uid: decoded.uid,
        });

        // ── Create Worker document ─────────────────────────────────
        const worker = await Worker.create({
            name: name.trim(),
            cnic,
            phone,
            firebase_uid: decoded.uid,
            firebase_phone_verified: true,
            selfie_url: selfie_url || null,
            cnic_front_url: cnic_front_url || null,
            cnic_back_url: cnic_back_url || null,
            skills,
            fee: Number(fee),
            location: {
                type: 'Point',
                coordinates: [Number(location.lng), Number(location.lat)],
            },
            status: 'pending',
            is_available: false,
        });

        // ── Cleanup PhoneVerification record ───────────────────────
        await PhoneVerification.deleteOne({ phone });

        logAuthEvent({ user_id: worker._id, phone, action: 'register', ip, status: 'success', role: 'worker' });

        // ── No JWT — worker must wait for admin approval ───────────
        res.status(201).json({
            success: true,
            message: 'Registration complete. Awaiting admin approval. You will be notified once approved.',
            worker: {
                _id: worker._id,
                status: worker.status,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0];
            const msg = field === 'cnic'
                ? 'A worker with this CNIC is already registered.'
                : 'Phone already registered.';
            return res.status(409).json({ success: false, message: msg });
        }
        console.error('[verifyWorkerFirebaseToken]', error.message);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// UNIFIED LOGIN — Users and Workers
// POST /api/auth/login
//
// Body: { firebase_id_token, phone }
// Firebase handles OTP — client sends ID token after confirmation
// Backend detects role from DB and issues appropriate JWT
// ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress;
    try {
        const { firebase_id_token, phone } = req.body;

        if (!firebase_id_token) {
            return res.status(400).json({ success: false, message: 'firebase_id_token is required' });
        }
        if (!isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone must be a valid Pakistani number (e.g. 03001234567)',
            });
        }

        // ── Verify Firebase ID Token ───────────────────────────────
        let decoded;
        try {
            decoded = await verifyFirebaseToken(firebase_id_token);
        } catch (err) {
            logAuthEvent({ phone, action: 'login_fail', ip, status: 'fail', details: err.message });
            return res.status(401).json({ success: false, message: err.message });
        }

        // ── Match phone numbers ────────────────────────────────────
        const firebasePhone = convertFirebasePhoneToPakistani(decoded.phone_number);
        if (firebasePhone !== phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number mismatch.',
            });
        }

        // ── Check if User ──────────────────────────────────────────
        const user = await User.findOne({ phone });
        if (user) {
            if (user.status === 'blocked') {
                logAuthEvent({ user_id: user._id, phone, action: 'login_fail', ip, status: 'blocked', role: 'user' });
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been blocked. Please contact support.',
                });
            }
            const token = generateToken({ id: user._id, role: 'user' });
            logAuthEvent({ user_id: user._id, phone, action: 'login', ip, status: 'success', role: 'user' });
            return res.status(200).json({
                success: true,
                token,
                role: 'user',
                profile: {
                    _id: user._id,
                    name: user.name,
                    phone: user.phone,
                    status: user.status,
                    profile_picture: user.profile_picture,
                },
            });
        }

        // ── Check if Worker ────────────────────────────────────────
        const worker = await Worker.findOne({ phone });
        if (worker) {
            if (worker.status === 'pending') {
                logAuthEvent({ user_id: worker._id, phone, action: 'login_fail', ip, status: 'pending', role: 'worker' });
                return res.status(403).json({
                    success: false,
                    message: 'Your account is under review. You will be notified once approved.',
                });
            }
            if (worker.status === 'rejected') {
                logAuthEvent({ user_id: worker._id, phone, action: 'login_fail', ip, status: 'rejected', role: 'worker' });
                return res.status(403).json({
                    success: false,
                    message: `Account registration was rejected. Reason: ${worker.rejection_reason || 'Please re-register.'}`,
                });
            }
            if (worker.status === 'blocked') {
                logAuthEvent({ user_id: worker._id, phone, action: 'login_fail', ip, status: 'blocked', role: 'worker' });
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been blocked. Please contact support.',
                });
            }
            const token = generateToken({ id: worker._id, role: 'worker' });
            logAuthEvent({ user_id: worker._id, phone, action: 'login', ip, status: 'success', role: 'worker' });
            return res.status(200).json({
                success: true,
                token,
                role: 'worker',
                profile: {
                    _id: worker._id,
                    name: worker.name,
                    phone: worker.phone,
                    status: worker.status,
                    skills: worker.skills,
                    fee: worker.fee,
                    is_available: worker.is_available,
                    rating: worker.rating,
                    selfie_url: worker.selfie_url,
                },
            });
        }

        // ── Phone not found in either collection ───────────────────
        logAuthEvent({ phone, action: 'login_fail', ip, status: 'not_found' });
        return res.status(404).json({
            success: false,
            message: 'No account found with this phone number. Please register first.',
        });
    } catch (error) {
        console.error('[login]', error.message);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// POST /api/auth/admin/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────
const loginAdmin = async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress;
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!admin) {
            logAuthEvent({ action: 'login_fail', ip, status: 'not_found', role: 'admin', details: email });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Admin account is inactive. Please contact a super admin.',
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            logAuthEvent({ user_id: admin._id, action: 'login_fail', ip, status: 'wrong_password', role: 'admin' });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken({ id: admin._id, role: 'admin' });
        logAuthEvent({ user_id: admin._id, action: 'login', ip, status: 'success', role: 'admin' });

        res.status(200).json({
            success: true,
            token,
            role: 'admin',
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('[loginAdmin]', error.message);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET CURRENT USER PROFILE — GET /api/auth/user/me
// ─────────────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
    try {
        const user = req.user.record;
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                profile_picture: user.profile_picture,
                status: user.status,
                location: {
                    lat: user.location?.coordinates[1],
                    lng: user.location?.coordinates[0],
                },
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('[getUserProfile]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET CURRENT WORKER PROFILE — GET /api/auth/worker/me
// ─────────────────────────────────────────────────────────────────────
const getWorkerProfile = async (req, res) => {
    try {
        const worker = req.user.record;
        res.status(200).json({
            success: true,
            worker: {
                _id: worker._id,
                name: worker.name,
                phone: worker.phone,
                cnic: worker.cnic,
                selfie_url: worker.selfie_url,
                skills: worker.skills,
                fee: worker.fee,
                status: worker.status,
                is_available: worker.is_available,
                rating: worker.rating,
                total_jobs: worker.total_jobs,
                location: {
                    lat: worker.location?.coordinates[1],
                    lng: worker.location?.coordinates[0],
                },
                createdAt: worker.createdAt,
            },
        });
    } catch (error) {
        console.error('[getWorkerProfile]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

module.exports = {
    verifyUserFirebaseToken,
    verifyWorkerFirebaseToken,
    login,
    loginAdmin,
    getUserProfile,
    getWorkerProfile,
};
