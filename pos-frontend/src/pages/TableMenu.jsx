import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaShoppingCart, FaTimes, FaExclamationTriangle, FaCog } from "react-icons/fa";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { axiosWrapper } from "../https/axiosWrapper";
import { getTableById } from "../https";

const TableMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isValidTable, setIsValidTable] = useState(null); // null = checking, true = valid, false = invalid
  const [tableData, setTableData] = useState(null);
  const [isCheckingTable, setIsCheckingTable] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const cartData = useSelector((state) => state.cart);
  
  const totalItems = cartData.reduce((total, item) => total + item.quantity, 0);

  const setupTables = async () => {
    try {
      setIsSettingUp(true);
      setSetupError(null);
      
      console.log('🔧 Setting up tables...');
      const response = await axiosWrapper.post('/api/setup/tables');
      
      if (response.data.success) {
        console.log('✅ Tables setup completed:', response.data);
        // Reload page sau khi setup xong
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Setup failed:', error);
      setSetupError(error.response?.data?.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Check table existence when component mounts or id changes
  useEffect(() => {
    const checkTableExists = async () => {
      try {
        document.title = `Menu | Table ${id}`;
        setIsCheckingTable(true);
        setSetupError(null);
        
        // Debug: Log environment info
        console.log('🔍 Environment Debug:', {
          isDev: import.meta.env.DEV,
          isProd: import.meta.env.PROD,
          backendUrl: import.meta.env.VITE_BACKEND_URL,
          mode: import.meta.env.MODE,
          baseUrl: import.meta.env.BASE_URL,
          tableId: id
        });
        
        // Basic validation first
        const tableId = parseInt(id);
        if (isNaN(tableId) || tableId < 1) {
          console.log('❌ Invalid table ID format:', id);
          setIsValidTable(false);
          setIsCheckingTable(false);
          return;
        }

        console.log('🔍 Checking table existence for ID:', tableId);
        
        // Check if table exists in backend
        const response = await getTableById(tableId);
        
        if (response.data.success) {
          console.log('✅ Table found:', response.data.data);
          setTableData(response.data.data);
          setIsValidTable(true);
        } else {
          console.log('❌ Table not found in response');
          setIsValidTable(false);
        }
        
      } catch (error) {
        console.log('❌ Error checking table:', error);
        
        if (error.response?.status === 404) {
          console.log('📋 Table not found - needs setup');
          setIsValidTable(false);
          setSetupError(`Table ${id} not found in database`);
        } else {
          console.log('🔥 Network or server error:', error.message);
          setSetupError(`Failed to check table: ${error.message}`);
          setIsValidTable(false);
        }
      } finally {
        setIsCheckingTable(false);
      }
    };

    checkTableExists();
  }, [id]);

  // Show loading while checking table
  if (isCheckingTable) {
    return (
      <div className="bg-[#1f1f1f] min-h-screen flex items-center justify-center">
        <div className="text-center text-white p-8">
          <FaCog className="animate-spin mx-auto text-6xl text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Checking Table...</h1>
          <p className="text-gray-400">Verifying table {id} existence...</p>
        </div>
      </div>
    );
  }

  // Show error/setup screen if table not found
  if (isValidTable === false) {
    return (
      <div className="bg-[#1f1f1f] min-h-screen flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-md">
          <FaExclamationTriangle className="mx-auto text-6xl text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Table Not Found</h1>
          <p className="text-gray-400 mb-6">
            Table {id} does not exist in the database.
          </p>
          
          {setupError && (
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{setupError}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={setupTables}
              disabled={isSettingUp}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSettingUp ? (
                <>
                  <FaCog className="animate-spin mr-2" />
                  Setting up tables...
                </>
              ) : (
                <>
                  <FaCog className="mr-2" />
                  Setup Tables
                </>
              )}
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#F6B100] text-black px-6 py-2 rounded-lg hover:bg-[#e6a100] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] min-h-screen">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-3 border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-[#f5f5f5] text-xl font-bold">
            Table {id} Menu
          </h1>
          {tableData && (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                tableData.status === 'Available' ? 'bg-green-600/20 text-green-400' :
                tableData.status === 'Booked' ? 'bg-blue-600/20 text-blue-400' :
                'bg-yellow-600/20 text-yellow-400'
              }`}>
                {tableData.status}
              </span>
              {tableData.seats && (
                <span className="text-[#ababab] text-sm">
                  {tableData.seats} seats
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Menu Section - Full width */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-3 lg:px-6 lg:py-4">
            <MenuContainer />
          </div>
        </div>

        {/* Desktop: Sidebar */}
        <div className="hidden lg:flex lg:w-80 lg:min-w-80">
          <div className="w-full h-full bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-y-auto">
            <div className="p-4">
              <CustomerInfo />
              <div className="mt-4">
                <CartInfo />
              </div>
              <div className="mt-4">
                <Bill />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Floating Cart Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowMobileCart(true)}
          className="relative bg-[#F6B100] text-[#1a1a1a] w-16 h-16 rounded-full shadow-lg hover:bg-[#e6a100] transition-colors flex items-center justify-center"
        >
          <FaShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-[#1a1a1a] w-full max-w-md h-[80vh] rounded-t-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a]">
              <h2 className="text-lg font-semibold text-white">Cart ({totalItems} items)</h2>
              <button
                onClick={() => setShowMobileCart(false)}
                className="text-[#ababab] hover:text-white p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <CustomerInfo />
              <div className="mt-4">
                <CartInfo />
              </div>
              <div className="mt-4">
                <Bill />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableMenu;