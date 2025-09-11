import React, { useState, useEffect } from 'react';
import { axiosWrapper } from '../https/axiosWrapper';

const Debug = () => {
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Attempting health check...');
      const response = await axiosWrapper.get('/health');
      setHealthData(response.data);
      console.log('✅ Health check success:', response.data);
    } catch (err) {
      console.error('❌ Health check failed:', err);
      setError({
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          baseURL: err.config?.baseURL,
          url: err.config?.url,
          method: err.config?.method,
          withCredentials: err.config?.withCredentials
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const testTableAPI = async () => {
    try {
      console.log('🔍 Testing table API...');
      const response = await axiosWrapper.get('/api/table');
      console.log('✅ Table API success:', response.data);
      alert('Table API works!');
    } catch (err) {
      console.error('❌ Table API failed:', err);
      alert(`Table API failed: ${err.message}`);
    }
  };

  const testSetupAPI = async () => {
    try {
      console.log('🔍 Testing setup API...');
      const response = await axiosWrapper.get('/api/setup/status');
      console.log('✅ Setup API success:', response.data);
      alert('Setup API works!');
    } catch (err) {
      console.error('❌ Setup API failed:', err);
      alert(`Setup API failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#1f1f1f] min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">🔧 Debug Page</h1>
        
        {/* Environment Info */}
        <div className="bg-[#262626] rounded-lg p-4 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="text-white">{import.meta.env.MODE}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dev:</span>
              <span className="text-white">{import.meta.env.DEV ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Prod:</span>
              <span className="text-white">{import.meta.env.PROD ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Backend URL:</span>
              <span className="text-white break-all">{import.meta.env.VITE_BACKEND_URL || 'NOT SET'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base URL:</span>
              <span className="text-white">{import.meta.env.BASE_URL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Host:</span>
              <span className="text-white">{window.location.origin}</span>
            </div>
          </div>
        </div>

        {/* Health Check */}
        <div className="bg-[#262626] rounded-lg p-4 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">Backend Health Check</h2>
          
          {loading && (
            <div className="text-yellow-400">🔄 Checking health...</div>
          )}
          
          {error && (
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-4">
              <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
              <pre className="text-red-300 text-xs overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
          
          {healthData && (
            <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 mb-4">
              <h3 className="text-green-400 font-semibold mb-2">✅ Health Check Success</h3>
              <pre className="text-green-300 text-xs overflow-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}
          
          <button
            onClick={checkHealth}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Health Check
          </button>
        </div>

        {/* API Tests */}
        <div className="bg-[#262626] rounded-lg p-4">
          <h2 className="text-white text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-y-3">
            <button
              onClick={testTableAPI}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Table API (/api/table)
            </button>
            <button
              onClick={testSetupAPI}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Test Setup API (/api/setup/status)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug;
