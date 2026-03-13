const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await createIndexes();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Create all required indexes upfront — v3 spec Section 3.12
 * These are created once at startup. MongoDB ignores if they already exist.
 */
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // ── Users ──────────────────────────────────────────────────
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('users').createIndex({ firebase_uid: 1 });

    // ── Workers ────────────────────────────────────────────────
    await db.collection('workers').createIndex({ cnic: 1 }, { unique: true });
    await db.collection('workers').createIndex({ phone: 1 }, { unique: true });
    await db.collection('workers').createIndex({ location: '2dsphere' });
    // Compound index for geospatial + status filter (Slice 3)
    await db.collection('workers').createIndex(
      { status: 1, is_available: 1, location: '2dsphere' }
    );
    await db.collection('workers').createIndex({ firebase_uid: 1 });

    // ── PhoneVerifications — TTL 15 minutes ────────────────────
    await db.collection('phone_verifications').createIndex(
      { expires_at: 1 },
      { expireAfterSeconds: 0 }
    );

    // ── Jobs (created early for Slice 3+) ─────────────────────
    await db.collection('jobs').createIndex({ user_id: 1, status: 1 });
    await db.collection('jobs').createIndex({ worker_id: 1, status: 1 });
    await db.collection('jobs').createIndex({ location: '2dsphere' });
    await db.collection('jobs').createIndex({ status: 1, created_at: -1 });

    // ── Quotes ────────────────────────────────────────────────
    await db.collection('quotes').createIndex({ job_id: 1 });
    await db.collection('quotes').createIndex(
      { worker_id: 1, job_id: 1 },
      { unique: true } // one quote per worker per job
    );

    // ── Feedback ──────────────────────────────────────────────
    await db.collection('feedback').createIndex({ worker_id: 1 });
    await db.collection('feedback').createIndex(
      { job_id: 1, user_id: 1 },
      { unique: true } // one review per job per user
    );

    // ── Complaints ────────────────────────────────────────────
    await db.collection('complaints').createIndex({ reporter_id: 1, created_at: -1 });

    // ── Notifications ──────────────────────────────────────────
    await db.collection('notifications').createIndex({ user_id: 1, created_at: -1 });
    await db.collection('notifications').createIndex({ worker_id: 1, created_at: -1 });

    // ── AnalyticsDaily ─────────────────────────────────────────
    await db.collection('analytics_daily').createIndex({ date: 1 }, { unique: true });

    console.log('✅ MongoDB Indexes ensured');
  } catch (err) {
    // Indexes may already exist — not a fatal error
    console.log('ℹ️  Index creation: some already exist (OK)');
  }
};

module.exports = connectDB;
