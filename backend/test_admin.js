// ────────────────────────────────────────────────────────
// Test Script for Slice 2: Admin Dashboard & Worker Approval
// Run with: node test_admin.js
// ────────────────────────────────────────────────────────

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const ADMIN_EMAIL = 'admin@homihire.com';
const ADMIN_PASSWORD = 'Admin@123456'; 

// Utility to make HTTP requests
const fetchAPI = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const runTest = async () => {
    console.log('--- Starting Admin Flow Test (Slice 2) ---\n');
    let adminToken;

    // 1. Log in as admin
    console.log('1. Logging in as Admin...');
    const loginRes = await fetchAPI('/auth/admin/login', 'POST', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (loginRes.status === 200 && loginRes.body.success) {
        adminToken = loginRes.body.token;
        console.log('✅ Logged in successfully. Token acquired.\n');
    } else {
        console.error('❌ Login failed:', loginRes.body);
        console.log('\nMake sure the server is running (npm run dev) and admin is seeded.');
        return;
    }

    // 2. Fetch Dashboard Stats
    console.log('2. Fetching Dashboard Stats...');
    const statsRes = await fetchAPI('/admin/stats', 'GET', null, adminToken);
    
    if (statsRes.status === 200 && statsRes.body.success) {
        console.log('✅ Stats fetched:');
        console.log(`   - Users: ${statsRes.body.total_users}`);
        console.log(`   - Workers (Pending): ${statsRes.body.total_workers.pending}`);
        console.log(`   - Workers (Approved): ${statsRes.body.total_workers.approved}`);
        console.log(`   - Cached at: ${statsRes.body.cached_at}`);
        console.log(`   - Returned from Redis Cache? : ${statsRes.body.from_cache}\n`);
    } else {
        console.error('❌ Stats fetch failed:', statsRes.body);
    }

    // 3. Fetch Pending Workers
    console.log('3. Fetching list of Pending Workers...');
    const pendingRes = await fetchAPI('/admin/workers/pending', 'GET', null, adminToken);
    let workerToApproveId = null;

    if (pendingRes.status === 200 && pendingRes.body.success) {
        const workers = pendingRes.body.data;
        console.log(`✅ Found ${workers.length} pending worker(s).\n`);
        
        if (workers.length > 0) {
            workerToApproveId = workers[0]._id;
            console.log(`   Worker Name: ${workers[0].name}, Phone: ${workers[0].phone}, _id: ${workerToApproveId}\n`);
        }
    } else {
        console.error('❌ Pending workers fetch failed:', pendingRes.body);
    }

    // 4. (Optional) Approve of a worker if any exist
    if (workerToApproveId) {
        console.log(`4. Approving Worker (${workerToApproveId})...`);
        const approveRes = await fetchAPI(`/admin/workers/${workerToApproveId}/approve`, 'PUT', { note: 'Verified successfully by test script' }, adminToken);
        
        if (approveRes.status === 200 && approveRes.body.success) {
            console.log('✅ Worker was successfully approved!\n');
        } else {
            console.error('❌ Worker approval failed:', approveRes.body);
        }
    } else {
        console.log('4. Skipping Approval Test: No pending workers found. You can create one via user registration (Slice 1).');
    }

    console.log('\n--- Test Completed ---');
};

runTest();
