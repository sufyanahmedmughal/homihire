/**
 * Admin Seeder Script
 * Run this manually to create the first admin account.
 * 
 * Usage:
 *   node src/scripts/seedAdmin.js
 * 
 * Prerequisites:
 *   - .env file must be configured with MONGO_URI
 *   - Run once only — admin is seeded manually as per Slice 1 spec
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const ADMIN_DATA = {
    name: 'HomiHire Admin',
    email: 'admin@homihire.com',
    password: 'Admin@123456', // ⚠️  CHANGE THIS IMMEDIATELY after first login
    role: 'super_admin',
};

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await Admin.findOne({ email: ADMIN_DATA.email });
        if (existing) {
            console.log('⚠️  Admin already exists with email:', ADMIN_DATA.email);
            console.log('ℹ️  No changes made. Delete the existing admin first if you want to reseed.');
            process.exit(0);
        }

        const admin = new Admin(ADMIN_DATA);
        await admin.save(); // Password is hashed via pre-save hook

        console.log('✅ Admin seeded successfully!');
        console.log('   Email   :', ADMIN_DATA.email);
        console.log('   Password:', ADMIN_DATA.password);
        console.log('');
        console.log('⚠️  IMPORTANT: Change the admin password immediately after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeder error:', error.message);
        process.exit(1);
    }
};

seedAdmin();
