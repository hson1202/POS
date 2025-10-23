import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaBox, FaUtensils, FaChartBar, FaCog, FaUsers, FaFileAlt, FaClock, FaCreditCard } from 'react-icons/fa';
import BottomNav from '../components/shared/BottomNav';
import { axiosWrapper } from '../https/axiosWrapper';

const More = () => {
  const navigate = useNavigate();
  const { role } = useSelector(state => state.user);
  const isAdmin = role === 'admin';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    totalIngredients: 0,
    ordersToday: 0,
    revenueToday: 0
  });

  const formatCurrency = (amount) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' }).format(amount || 0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [menuRes, ingRes, ordersRes, dashRes] = await Promise.all([
          axiosWrapper.get('/api/menu-items'),
          axiosWrapper.get('/api/ingredients'),
          axiosWrapper.get('/api/order'),
          axiosWrapper.get('/api/order/stats')
        ]);

        const menuItems = menuRes.data?.data || [];
        const ingredients = ingRes.data?.data || [];
        const orders = ordersRes.data?.data || [];
        const dashboardStats = dashRes.data?.data || {};

        // Orders today
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ordersToday = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= today && d < tomorrow;
        }).length;

        setStats({
          totalMenuItems: menuItems.length,
          totalIngredients: ingredients.length,
          ordersToday,
          revenueToday: dashboardStats.dailyRevenue || 0
        });
      } catch (e) {
        // fallback: keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Tổng quan hệ thống',
      icon: <FaChartBar className="text-2xl" />,
      path: '/dashboard',
      color: 'bg-blue-600'
    },
    {
      title: 'Quản lý kho',
      description: 'Quản lý nguyên liệu và tồn kho',
      icon: <FaBox className="text-2xl" />,
      path: '/inventory',
      color: 'bg-green-600'
    },
    {
      title: 'Quản lý menu',
      description: 'Thêm, sửa, xóa món ăn và công thức',
      icon: <FaUtensils className="text-2xl" />,
      path: '/menu-management',
      color: 'bg-purple-600'
    },
    {
      title: 'Quản lý nhân viên',
      description: 'Quản lý tài khoản và phân quyền',
      icon: <FaUsers className="text-2xl" />,
      path: '/employee-management',
      color: 'bg-orange-600'
    },
    {
      title: 'Lịch sử đơn hàng',
      description: 'Xem tất cả đơn hàng',
      icon: <FaClock className="text-2xl" />,
      path: '/order-history',
      color: 'bg-yellow-600'
    },
    {
      title: 'Lịch sử thanh toán',
      description: 'Xem tất cả giao dịch thanh toán',
      icon: <FaCreditCard className="text-2xl" />,
      path: '/payment-history',
      color: 'bg-teal-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F6B100]">Tính năng khác</h1>
          <p className="text-[#ababab] mt-2">Quản lý hệ thống và cài đặt</p>
          {!isAdmin && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Lưu ý:</strong> Một số tính năng quản lý chỉ dành cho Admin. 
                Vui lòng liên hệ Admin để được cấp quyền truy cập.
              </p>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            // Chỉ hiển thị các tính năng quản lý cho admin
            if ((item.path === '/inventory' || item.path === '/menu-management' || item.path === '/employee-management') && !isAdmin) {
              return null;
            }
            
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className="bg-[#262626] rounded-lg p-6 border border-[#3a3a3a] hover:border-[#F6B100] transition-all duration-300 cursor-pointer hover:transform hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${item.color} p-3 rounded-lg`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-[#ababab] text-sm">{item.description}</p>
                    {!isAdmin && (item.path === '/inventory' || item.path === '/menu-management' || item.path === '/employee-management') && (
                      <p className="text-red-400 text-xs mt-1">Chỉ dành cho Admin</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[#F6B100] text-sm font-medium">Nhấn để mở</span>
                  <div className="w-2 h-2 bg-[#F6B100] rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Thống kê nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#262626] rounded-lg p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#ababab] text-sm">Tổng món ăn</p>
                  <p className="text-2xl font-bold text-white">{stats.totalMenuItems}</p>
                </div>
                <div className="bg-green-600 p-3 rounded-lg">
                  <FaUtensils className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#262626] rounded-lg p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#ababab] text-sm">Nguyên liệu</p>
                  <p className="text-2xl font-bold text-white">{stats.totalIngredients}</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-lg">
                  <FaBox className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#262626] rounded-lg p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#ababab] text-sm">Đơn hàng hôm nay</p>
                  <p className="text-2xl font-bold text-white">{stats.ordersToday}</p>
                </div>
                <div className="bg-purple-600 p-3 rounded-lg">
                  <FaChartBar className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#262626] rounded-lg p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#ababab] text-sm">Doanh thu hôm nay</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenueToday)}</p>
                </div>
                <div className="bg-orange-600 p-3 rounded-lg">
                  <FaChartBar className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
};

export default More; 