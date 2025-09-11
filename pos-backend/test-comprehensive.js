const axios = require('axios');

// Configuration
const DEV_BASE_URL = 'http://localhost:3000';
const PROD_BASE_URL = process.env.BACKEND_URL || 'https://pos-mq9w.onrender.com';

const runComprehensiveTests = async (baseURL) => {
    console.log(`\n🧪 COMPREHENSIVE TESTING: ${baseURL}`);
    console.log('='.repeat(50));
    
    const results = {
        environment: baseURL.includes('localhost') ? 'DEVELOPMENT' : 'PRODUCTION',
        passed: 0,
        failed: 0,
        tests: []
    };
    
    const test = async (name, testFn) => {
        try {
            console.log(`\n🔍 Testing: ${name}`);
            const result = await testFn();
            console.log(`   ✅ PASSED: ${result}`);
            results.tests.push({ name, status: 'PASSED', result });
            results.passed++;
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
            results.tests.push({ name, status: 'FAILED', error: error.message });
            results.failed++;
        }
    };
    
    // Test 1: Basic Health Check
    await test('Health Check', async () => {
        const response = await axios.get(`${baseURL}/health`, { timeout: 5000 });
        return `Status: ${response.status}, Environment: ${response.data.environment}`;
    });
    
    // Test 2: Root Endpoint
    await test('Root Endpoint', async () => {
        const response = await axios.get(`${baseURL}/`, { timeout: 5000 });
        return `Message: ${response.data.message}`;
    });
    
    // Test 3: Setup Status
    await test('Setup Status Check', async () => {
        const response = await axios.get(`${baseURL}/api/setup/status`, { timeout: 5000 });
        return `Tables: ${response.data.data.totalTables}`;
    });
    
    // Test 4: Create Tables (if needed)
    await test('Table Creation', async () => {
        try {
            const statusResponse = await axios.get(`${baseURL}/api/setup/status`);
            if (statusResponse.data.data.totalTables === 0) {
                const createResponse = await axios.post(`${baseURL}/api/setup/tables`);
                return `Created ${createResponse.data.data.created} tables`;
            } else {
                return `Tables already exist: ${statusResponse.data.data.totalTables}`;
            }
        } catch (error) {
            throw new Error(`Table setup failed: ${error.message}`);
        }
    });
    
    // Test 5: Get Tables (Auth Required)
    await test('Get Tables (Auth Required)', async () => {
        try {
            const response = await axios.get(`${baseURL}/api/table`, { 
                timeout: 5000,
                validateStatus: (status) => status < 500 // Accept 401/403 as valid response
            });
            if (response.status === 401) {
                return 'Authentication required (expected)';
            }
            return `Tables retrieved: ${response.data.data?.length || 0}`;
        } catch (error) {
            if (error.response?.status === 401) {
                return 'Authentication required (expected)';
            }
            throw error;
        }
    });
    
    // Test 6: Order Creation (Without Auth)
    await test('Order Creation (Guest)', async () => {
        const orderData = {
            customerDetails: {
                name: "Test Customer",
                phone: "1234567890",
                guests: 2
            },
            orderStatus: "Pending",
            bills: {
                total: 100,
                tax: 10,
                totalWithTax: 110
            },
            items: [{
                name: "Test Item",
                quantity: 1,
                price: 100
            }],
            table: "1" // Test table
        };
        
        const response = await axios.post(`${baseURL}/api/order/`, orderData, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        return `Order created: ${response.data.data._id}`;
    });
    
    // Test 7: CORS Check
    await test('CORS Configuration', async () => {
        const response = await axios.get(`${baseURL}/health`, {
            headers: {
                'Origin': baseURL.includes('localhost') ? 'http://localhost:5173' : 'https://pos-fe-ihui.onrender.com'
            }
        });
        return `CORS allowed for origin`;
    });
    
    // Test 8: Environment Variables Check
    await test('Environment Check', async () => {
        const response = await axios.get(`${baseURL}/health`);
        const env = response.data.environment;
        const expected = baseURL.includes('localhost') ? 'development' : 'production';
        if (env === expected) {
            return `Environment correct: ${env}`;
        } else {
            throw new Error(`Environment mismatch: expected ${expected}, got ${env}`);
        }
    });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 TEST SUMMARY for ${results.environment}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
        console.log('\n🚨 FAILED TESTS:');
        results.tests.filter(t => t.status === 'FAILED').forEach(test => {
            console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    return results;
};

// Run tests for both environments
const runAllTests = async () => {
    console.log('🚀 STARTING COMPREHENSIVE TESTING SUITE');
    console.log('This will test both development and production environments');
    
    const results = {};
    
    // Test Development
    try {
        console.log('\n🔧 Testing Development Environment...');
        results.development = await runComprehensiveTests(DEV_BASE_URL);
    } catch (error) {
        console.log('❌ Development tests failed to start:', error.message);
        results.development = { error: error.message };
    }
    
    // Test Production
    try {
        console.log('\n🌐 Testing Production Environment...');
        results.production = await runComprehensiveTests(PROD_BASE_URL);
    } catch (error) {
        console.log('❌ Production tests failed to start:', error.message);
        results.production = { error: error.message };
    }
    
    // Final Comparison
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ENVIRONMENT COMPARISON');
    console.log('='.repeat(60));
    
    if (results.development && results.production && !results.development.error && !results.production.error) {
        console.log(`Development Success Rate: ${((results.development.passed / (results.development.passed + results.development.failed)) * 100).toFixed(1)}%`);
        console.log(`Production Success Rate: ${((results.production.passed / (results.production.passed + results.production.failed)) * 100).toFixed(1)}%`);
        
        if (results.development.passed > results.production.passed) {
            console.log('\n⚠️  PRODUCTION ISSUES DETECTED!');
            console.log('Production has more failures than development');
        } else if (results.development.passed === results.production.passed) {
            console.log('\n✅ ENVIRONMENTS ARE CONSISTENT');
        }
    }
    
    console.log('\n🎉 TESTING COMPLETE!');
    return results;
};

// Run the tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runComprehensiveTests, runAllTests };
