const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const createTestUser = async () => {
    try {
        console.log('🧪 Creating test user...');
        
        // Test user data
        const testUser = {
            name: 'Test Admin',
            phone: '1234567890',
            email: 'test@admin.com',
            password: 'password123',
            role: 'admin'
        };
        
        // Try to register
        try {
            const registerResponse = await axios.post(`${BASE_URL}/api/user/register`, testUser);
            console.log('✅ User created successfully');
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exist')) {
                console.log('ℹ️ User already exists, proceeding to login...');
            } else {
                throw error;
            }
        }
        
        // Login to get token
        console.log('🔐 Logging in to get token...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        console.log('📋 Login response structure:', JSON.stringify(loginResponse.data, null, 2));
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`🎫 Token: ${token ? token.substring(0, 20) + '...' : 'Token not found in response'}`);
        
        return token;
    } catch (error) {
        console.error('❌ Error creating test user:', error.response?.data?.message || error.message);
        throw error;
    }
};

const testAPIsWithAuth = async (token) => {
    console.log('\n🧪 Testing APIs with authentication...');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test dashboard stats
        console.log('\n📡 Testing /api/order/stats');
        const statsResponse = await axios.get(`${BASE_URL}/api/order/stats`, { headers });
        console.log('✅ Dashboard stats successful');
        console.log('📊 Stats:', Object.keys(statsResponse.data.data));
        
        // Test payment endpoints
        console.log('\n📡 Testing /api/payment');
        const paymentsResponse = await axios.get(`${BASE_URL}/api/payment`, { headers });
        console.log('✅ Payments list successful');
        console.log(`📊 Found ${paymentsResponse.data.data.length} payments`);
        
        console.log('\n📡 Testing /api/payment/stats');
        const paymentStatsResponse = await axios.get(`${BASE_URL}/api/payment/stats`, { headers });
        console.log('✅ Payment stats successful');
        console.log('📊 Payment Stats:', Object.keys(paymentStatsResponse.data.data));
        
        console.log('\n✅ All API tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error.response?.data?.message || error.message);
        return false;
    }
};

const runFullTest = async () => {
    try {
        const token = await createTestUser();
        const success = await testAPIsWithAuth(token);
        
        if (success) {
            console.log('\n🎉 All tests completed successfully!');
            console.log('📋 You can now use the frontend with the following credentials:');
            console.log('   Email: test@admin.com');
            console.log('   Password: password123');
        } else {
            console.log('\n❌ Some tests failed');
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
};

runFullTest();
