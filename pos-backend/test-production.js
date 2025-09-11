const axios = require('axios');

// Configure for production
const BASE_URL = process.env.BACKEND_URL || 'https://pos-backend-xyz.onrender.com';

console.log('🧪 Testing Production APIs...');
console.log('📍 Base URL:', BASE_URL);

const tests = [
    {
        name: 'Health Check',
        method: 'GET',
        url: '/health',
        requireAuth: false
    },
    {
        name: 'Root Endpoint',
        method: 'GET', 
        url: '/',
        requireAuth: false
    },
    {
        name: 'Setup Status',
        method: 'GET',
        url: '/api/setup/status',
        requireAuth: false
    },
    {
        name: 'Tables (Auth Required)',
        method: 'GET',
        url: '/api/table',
        requireAuth: true
    }
];

async function runTests() {
    for (const test of tests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   ${test.method} ${BASE_URL}${test.url}`);
            
            const config = {
                method: test.method.toLowerCase(),
                url: `${BASE_URL}${test.url}`,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ProductionTester/1.0'
                }
            };
            
            if (test.requireAuth) {
                console.log('   ⚠️  Auth required - may fail without login');
            }
            
            const response = await axios(config);
            
            console.log(`   ✅ Success: ${response.status} ${response.statusText}`);
            if (response.data) {
                console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Status: ${error.response.status}`);
                console.log(`   📄 Data:`, error.response.data);
            }
        }
    }
    
    console.log('\n🎉 Test completed!');
}

runTests().catch(console.error);
