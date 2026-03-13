const { VALID_SKILLS } = require('../models/Worker');

// Sub-categories per main category — Section 2 of v3 spec
const SUB_CATEGORIES = {
    'Cleaning': [
        'Home Cleaning', 'Deep Cleaning', 'Sofa / Upholstery Cleaning',
        'Carpet Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning',
        'Office Cleaning', 'After-Construction Cleaning', 'Mattress Cleaning',
        'Window / Glass Cleaning', 'Water Tank Cleaning',
    ],
    'Plumbing': [
        'Pipe Leak Repair', 'Tap / Faucet Repair', 'Drain Unblocking',
        'Toilet Repair / Installation', 'Water Pump Installation',
        'Geyser / Water Heater Repair', 'Pipeline Installation',
        'Shower Installation', 'Water Tank Installation',
    ],
    'Electrical': [
        'Wiring / Rewiring', 'Switchboard / Socket Repair', 'Fan Installation / Repair',
        'AC Installation / Service', 'Light Fixture Installation',
        'Generator / UPS Installation', 'DB Board / Fuse Box Repair',
        'CCTV Installation', 'Inverter / Solar Panel Setup',
    ],
    'Carpentry': [
        'Door Repair / Installation', 'Window Repair / Installation', 'Furniture Repair',
        'Cupboard / Wardrobe Making', 'Kitchen Cabinet Installation',
        'False Ceiling / POP Work', 'Flooring Installation',
        'Staircase / Railing Work', 'Furniture Polish / Touch-up',
    ],
    'Building / Construction': [
        'Wall Plastering', 'Tile Fixing', 'Painting — Interior', 'Painting — Exterior',
        'Masonry / Brickwork', 'Waterproofing', 'Demolition / Breakage',
        'Marble / Granite Fixing', 'Roof Repair',
    ],
    'Repairing / Maintenance': [
        'Appliance Repair — Washing Machine', 'Appliance Repair — Refrigerator',
        'Appliance Repair — Microwave / Oven', 'TV / LCD Repair',
        'Computer / Laptop Repair', 'Lock / Key Services',
        'Pest Control', 'Gardening / Lawn Care', 'Home Shifting / Moving',
    ],
};

// Regexes — Section 4.3 of v3 spec
const PHONE_REGEX = /^03[0-9]{9}$/;
const CNIC_REGEX = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
const NAME_REGEX = /^[a-zA-Z\s.]+$/; // letters, spaces, dots only

/** Validate Pakistani phone number */
const isValidPhone = (phone) => PHONE_REGEX.test(phone);

/** Validate CNIC */
const isValidCNIC = (cnic) => CNIC_REGEX.test(cnic);

/** Validate name — 3-100 chars, letters/spaces/dots */
const isValidName = (name) =>
    typeof name === 'string' &&
    name.trim().length >= 3 &&
    name.trim().length <= 100 &&
    NAME_REGEX.test(name.trim());

/** Validate OTP — exactly 6 numeric digits */
const isValidOTP = (otp) => /^\d{6}$/.test(String(otp));

/**
 * Validate fee — v3 spec Section 4.3
 * min 100 PKR (changed from 1 in v2), max 999999 PKR
 */
const isValidFee = (fee) => {
    const num = Number(fee);
    return !isNaN(num) && num >= 100 && num <= 999999;
};

/** Validate coordinates */
const isValidCoordinates = (lat, lng) => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
};

/** Validate skills array — all must be valid main categories */
const isValidSkills = (skills) => {
    return (
        Array.isArray(skills) &&
        skills.length >= 1 &&
        skills.every((s) => VALID_SKILLS.includes(s))
    );
};

/**
 * Validate that a sub-category belongs to the given main category
 * Used in Slice 3 job posting
 */
const isValidSubCategory = (category, subCategory) => {
    const subs = SUB_CATEGORIES[category];
    if (!subs) return false;
    return subs.includes(subCategory);
};

/**
 * Validate rating — integer 1-5 only (v3 spec Section 4.3)
 * Decimal ratings rejected
 */
const isValidRating = (rating) => {
    const num = Number(rating);
    return Number.isInteger(num) && num >= 1 && num <= 5;
};

/**
 * Validate pagination params — page min 1, limit 1-50
 */
const isValidPagination = (limit) => {
    const l = Number(limit);
    return !isNaN(l) && l >= 1 && l <= 50;
};

/**
 * Strip HTML/script tags for XSS prevention — Section 4.3
 */
const sanitizeText = (text) => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
};

/**
 * Validate a Cloudinary URL — basic format check
 */
const isValidCloudinaryUrl = (url) => {
    if (!url) return true; // optional field
    return typeof url === 'string' &&
        (url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/'));
};

module.exports = {
    SUB_CATEGORIES,
    VALID_SKILLS,
    isValidPhone,
    isValidCNIC,
    isValidName,
    isValidOTP,
    isValidFee,
    isValidCoordinates,
    isValidSkills,
    isValidSubCategory,
    isValidRating,
    isValidPagination,
    isValidCloudinaryUrl,
    sanitizeText,
};
