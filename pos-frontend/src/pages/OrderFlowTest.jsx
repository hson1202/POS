import React, { useState } from 'react';
import { axiosWrapper, axiosGuest } from '../https/axiosWrapper';

const OrderFlowTest = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, message, data = null) => {
    setResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTest = async (testName, testFunction) => {
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = await testFunction();
      addResult(testName, 'SUCCESS', result.message || 'Test passed', result.data);
      return true;
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      addResult(testName, 'FAILED', error.message || 'Test failed', {
        status: error.response?.status,
        data: error.response?.data
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    console.log('🚀 Starting Order Flow Tests...');
    
    // Test 1: Environment Check
    await runTest('Environment Check', async () => {
      const env = {
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        backendUrl: import.meta.env.VITE_BACKEND_URL,
        mode: import.meta.env.MODE
      };
      return {
        message: `Environment: ${env.mode}, Backend: ${env.backendUrl || 'localhost:3000'}`,
        data: env
      };
    });
    
    // Test 2: Backend Health Check
    await runTest('Backend Health Check', async () => {
      const response = await axiosWrapper.get('/health');
      return {
        message: `Backend healthy: ${response.data.status}`,
        data: response.data
      };
    });
    
    // Test 3: Setup Status
    await runTest('Setup Status', async () => {
      const response = await axiosWrapper.get('/api/setup/status');
      return {
        message: `Tables in DB: ${response.data.data.totalTables}`,
        data: response.data.data
      };
    });
    
    // Test 4: Create Tables if Needed
    await runTest('Table Setup', async () => {
      const statusResponse = await axiosWrapper.get('/api/setup/status');
      if (statusResponse.data.data.totalTables === 0) {
        const createResponse = await axiosWrapper.post('/api/setup/tables');
        return {
          message: `Created ${createResponse.data.data.created} tables`,
          data: createResponse.data.data
        };
      } else {
        return {
          message: `Tables already exist: ${statusResponse.data.data.totalTables}`,
          data: statusResponse.data.data
        };
      }
    });
    
    // Test 5: Guest Order (Customer Route)
    await runTest('Guest Order Creation', async () => {
      const orderData = {
        customerDetails: {
          name: "Test Customer",
          phone: "1234567890", 
          guests: 2
        },
        orderStatus: "Pending",
        bills: {
          total: 50,
          tax: 5,
          totalWithTax: 55
        },
        items: [{
          name: "Test Pizza",
          quantity: 1,
          price: 50
        }],
        table: "3" // Test table 3
      };
      
      const response = await axiosGuest.post('/api/order/', orderData);
      return {
        message: `Guest order created: ${response.data.data._id}`,
        data: response.data.data
      };
    });
    
    // Test 6: Get Tables (Auth Required)
    await runTest('Get Tables (Auth)', async () => {
      try {
        const response = await axiosWrapper.get('/api/table');
        return {
          message: `Retrieved ${response.data.data.length} tables`,
          data: response.data.data
        };
      } catch (error) {
        if (error.response?.status === 401) {
          return {
            message: 'Auth required (expected for logged out state)',
            data: { requiresAuth: true }
          };
        }
        throw error;
      }
    });
    
    // Test 7: Menu Items
    await runTest('Get Menu Items', async () => {
      const response = await axiosWrapper.get('/api/menu-items');
      return {
        message: `Retrieved ${response.data.data?.length || 0} menu items`,
        data: response.data.data
      };
    });
    
    // Test 8: Customer Route Access Test
    await runTest('Table Route Test', async () => {
      // This tests if table route is accessible
      const tableId = 3;
      const currentPath = window.location.pathname;
      
      if (currentPath.includes('/table/')) {
        return {
          message: `Table route accessible: ${currentPath}`,
          data: { currentPath, tableId }
        };
      } else {
        return {
          message: 'Not on table route (test from /debug or other route)',
          data: { currentPath }
        };
      }
    });

    setIsRunning(false);
    console.log('✅ All tests completed!');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="bg-[#1f1f1f] min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">🧪 Order Flow Testing</h1>
        
        {/* Control Panel */}
        <div className="bg-[#262626] rounded-lg p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
            <a
              href="/table/3"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
            >
              Test Table 3 Route
            </a>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-[#262626] rounded-lg p-4">
            <h2 className="text-white text-xl font-semibold mb-4">Test Results</h2>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-3 text-center">
                <div className="text-green-400 text-2xl font-bold">
                  {results.filter(r => r.status === 'SUCCESS').length}
                </div>
                <div className="text-green-300 text-sm">Passed</div>
              </div>
              <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 text-center">
                <div className="text-red-400 text-2xl font-bold">
                  {results.filter(r => r.status === 'FAILED').length}
                </div>
                <div className="text-red-300 text-sm">Failed</div>
              </div>
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-3 text-center">
                <div className="text-blue-400 text-2xl font-bold">
                  {results.length > 0 ? Math.round((results.filter(r => r.status === 'SUCCESS').length / results.length) * 100) : 0}%
                </div>
                <div className="text-blue-300 text-sm">Success Rate</div>
              </div>
            </div>
            
            {/* Detailed Results */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'SUCCESS'
                      ? 'bg-green-600/10 border-green-600'
                      : 'bg-red-600/10 border-red-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-lg ${result.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                      {result.status === 'SUCCESS' ? '✅' : '❌'}
                    </span>
                    <span className="text-white font-semibold">{result.test}</span>
                    <span className="text-gray-400 text-sm ml-auto">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`text-sm mb-2 ${result.status === 'SUCCESS' ? 'text-green-300' : 'text-red-300'}`}>
                    {result.message}
                  </div>
                  {result.data && (
                    <details className="text-xs">
                      <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                        Show Details
                      </summary>
                      <pre className="mt-2 p-2 bg-[#1a1a1a] rounded text-gray-300 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {results.length === 0 && !isRunning && (
          <div className="bg-[#262626] rounded-lg p-8 text-center">
            <p className="text-gray-400">No test results yet. Click "Run All Tests" to begin testing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFlowTest;
