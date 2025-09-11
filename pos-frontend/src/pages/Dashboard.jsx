import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUtensils, FaBox, FaChartLine, FaClock, FaMoneyBillWave, FaShoppingCart, FaCreditCard } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const Dashboard = () => {
  const { role } = useSelector(state => state.user);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalPayments: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockItems: [],
    completedOrders: 0,
    pendingOrders: 0,
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the new dashboard stats API endpoint
      const statsResponse = await axiosWrapper.get('/api/order/stats');
      const dashboardStats = statsResponse.data.data;
      
      // Also get payment stats for total payments count
      const paymentStatsResponse = await axiosWrapper.get('/api/payment/stats');
      const paymentStats = paymentStatsResponse.data.data;

      setStats({
        totalUsers: dashboardStats.totalUsers || 0,
        totalOrders: dashboardStats.totalOrders || 0,
        totalPayments: paymentStats.totalPayments || 0,
        totalRevenue: dashboardStats.totalRevenue || 0,
        recentOrders: dashboardStats.recentOrders || [],
        lowStockItems: dashboardStats.lowStockItems || [],
        // Additional stats for enhanced dashboard
        completedOrders: dashboardStats.completedOrders || 0,
        pendingOrders: dashboardStats.pendingOrders || 0,
        totalTables: dashboardStats.totalTables || 0,
        occupiedTables: dashboardStats.occupiedTables || 0,
        availableTables: dashboardStats.availableTables || 0,
        dailyRevenue: dashboardStats.dailyRevenue || 0,
        weeklyRevenue: dashboardStats.weeklyRevenue || 0,
        monthlyRevenue: dashboardStats.monthlyRevenue || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      enqueueSnackbar('Không thể tải dữ liệu dashboard', { variant: 'error' });
      
      // Fallback to empty stats if API fails
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalPayments: 0,
        totalRevenue: 0,
        recentOrders: [],
        lowStockItems: [],
        completedOrders: 0,
        pendingOrders: 0,
        totalTables: 0,
        occupiedTables: 0,
        availableTables: 0,
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F6B100]">Dashboard</h1>
          <p className="text-[#ababab] mt-2">Tổng quan hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng nhân viên</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FaUsers className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FaShoppingCart className="text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng thanh toán</p>
                <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <FaCreditCard className="text-purple-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <FaMoneyBillWave className="text-yellow-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Thao tác nhanh</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/inventory')}
                className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a] hover:border-[#F6B100] transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <FaBox className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Quản lý kho</p>
                    <p className="text-[#ababab] text-sm">Nguyên liệu</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/menu-management')}
                className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a] hover:border-[#F6B100] transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <FaUtensils className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Quản lý menu</p>
                    <p className="text-[#ababab] text-sm">Món ăn</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/employee-management')}
                className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a] hover:border-[#F6B100] transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <FaUsers className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Quản lý nhân viên</p>
                    <p className="text-[#ababab] text-sm">Nhân sự</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/order-history')}
                className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a] hover:border-[#F6B100] transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-lg">
                    <FaClock className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Lịch sử đơn hàng</p>
                    <p className="text-[#ababab] text-sm">Orders</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Đơn hàng gần đây</h2>
            <button
              onClick={() => navigate('/order-history')}
              className="text-[#F6B100] hover:text-yellow-400 transition-colors"
            >
              Xem tất cả
            </button>
          </div>
          
          <div className="bg-[#262626] rounded-lg border border-[#3a3a3a] overflow-hidden">
            {stats.recentOrders.length > 0 ? (
              <div className="divide-y divide-[#3a3a3a]">
                {stats.recentOrders.map((order, index) => (
                  <div key={order._id || index} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Bàn {order.tableNumber}</p>
                        <p className="text-[#ababab] text-sm">
                          {order.items?.length || 0} món • {formatCurrency(order.totalAmount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status || 'N/A'}
                        </p>
                        <p className="text-[#ababab] text-xs">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FaShoppingCart className="text-4xl text-[#ababab] mx-auto mb-4" />
                <p className="text-[#ababab]">Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {isAdmin && stats.lowStockItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Cảnh báo tồn kho thấp</h2>
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FaBox className="text-red-400 text-xl" />
                <p className="text-red-400 font-medium">Cần bổ sung nguyên liệu</p>
              </div>
              <div className="space-y-2">
                {stats.lowStockItems.slice(0, 3).map((item, index) => (
                  <div key={item._id || index} className="flex justify-between items-center">
                    <span className="text-white">{item.name}</span>
                    <span className="text-red-400">
                      {item.currentStock}{item.unit} / {item.minStock}{item.unit}
                    </span>
                  </div>
                ))}
                {stats.lowStockItems.length > 3 && (
                  <p className="text-[#ababab] text-sm">
                    Và {stats.lowStockItems.length - 3} nguyên liệu khác...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
