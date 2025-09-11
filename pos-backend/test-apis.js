const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test function
const testAPI = async (endpoint, method = 'GET', data = null, headers = {}) => {
    try {
        console.log(`\n📡 Testing ${method} ${endpoint}`);
        
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        console.log(`✅ Success: ${response.status} ${response.statusText}`);
        
        if (response.data.data) {
            if (Array.isArray(response.data.data)) {
                console.log(`📊 Returned ${response.data.data.length} items`);
            } else {
                console.log(`📊 Data keys: ${Object.keys(response.data.data).join(', ')}`);
            }
        }
        
        return response.data;
    } catch (error) {
        console.log(`❌ Error: ${error.response?.status} ${error.response?.statusText}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        return null;
    }
};

// Main test function
const runTests = async () => {
    console.log('🧪 Starting API Tests...');
    console.log('================================');
    
    // Test endpoints that don't require authentication first
    await testAPI('/api/order/stats');
    await testAPI('/api/payment');
    await testAPI('/api/payment/stats');
    
    // Test with dummy authentication header (you might need to get a real token)
    const authHeaders = {
        'Authorization': 'Bearer dummy_token' // Replace with real token if needed
    };
    
    console.log('\n🔐 Testing authenticated endpoints...');
    await testAPI('/api/payment', 'GET', null, authHeaders);
    await testAPI('/api/payment/stats', 'GET', null, authHeaders);
    await testAPI('/api/order/stats', 'GET', null, authHeaders);
    
    console.log('\n✅ API Tests completed!');
    console.log('================================');
    
    process.exit(0);
};

// Run tests
runTests().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
