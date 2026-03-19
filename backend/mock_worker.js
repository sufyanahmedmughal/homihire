const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const makeRequest = (path, method, body) => {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.write(JSON.stringify(body));
        req.end();
    });
};

const simulateMobileApp = async () => {
    console.log('🤖 Simulating Mobile App Worker Registration...\n');

    // To test the registration API, we need a valid mock Firebase token.
    // However, since Firebase validates the token on google's servers, we cannot easily mock it here.
    // What we can do instead is insert a fake Pending Worker directly into MongoDB so testing the Admin screen works
    const mongoose = require('mongoose');
    const { Worker } = require('./src/models/Worker');
    require('dotenv').config();

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    try {
        const fakeWorker = await Worker.create({
            name: "John Doe Test Worker",
            cnic: "37405-1234567-9",
            phone: `0300${Math.floor(1000000 + Math.random() * 9000000)}`, // Random pakistani number
            firebase_uid: `fake_uid_${Date.now()}`,
            firebase_phone_verified: true,
            selfie_url: "https://res.cloudinary.com/homihire/image/upload/v1/dummy/selfie.jpg",
            skills: ["Plumbing"],
            fee: 1500,
            location: { type: 'Point', coordinates: [73.0479, 33.6844] },
            status: "pending", 
            is_available: false
        });

        console.log('\n✅ Successfully inserted a PENDING Worker directly into the database!');
        console.log(`Name:  ${fakeWorker.name}`);
        console.log(`Phone: ${fakeWorker.phone}`);
        console.log(`State: ${fakeWorker.status}`);
        console.log('\n👉 Tell your team member to refresh the Admin Panel. They should now see this worker waiting for approval!');
    } catch (e) {
        console.error('Error creating worker:', e);
    }

    mongoose.disconnect();
};

simulateMobileApp();
