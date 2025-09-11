import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEye, FaCreditCard, FaMoneyBillWave, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, ordersRes] = await Promise.all([
        axiosWrapper.get('/api/payment'),
        axiosWrapper.get('/api/order')
      ]);
      
      setPayments(paymentsRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      enqueueSnackbar('Không thể tải lịch sử thanh toán', { variant: 'error' });
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
      case 'completed': return 'text-green-500 bg-green-900/20';
      case 'pending': return 'text-yellow-500 bg-yellow-900/20';
      case 'failed': return 'text-red-500 bg-red-900/20';
      case 'cancelled': return 'text-red-500 bg-red-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'Thành công';
      case 'pending': return 'Chờ xử lý';
      case 'failed': return 'Thất bại';
      case 'cancelled': return 'Đã hủy';
      default: return status || 'N/A';
    }
  };

  const getMethodLabel = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'qr_code': return 'QR Code';
      default: return method || 'N/A';
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <FaMoneyBillWave className="text-green-400" />;
      case 'card': return <FaCreditCard className="text-blue-400" />;
      case 'bank_transfer': return <FaCreditCard className="text-purple-400" />;
      case 'qr_code': return <FaCreditCard className="text-orange-400" />;
      default: return <FaCreditCard className="text-gray-400" />;
    }
  };

  const getOrderInfo = (orderId) => {
    return orders.find(order => order._id === orderId);
  };

  const filteredPayments = payments.filter(payment => {
    const order = getOrderInfo(payment.orderId);
    const matchesSearch = 
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order?.customerPhone?.includes(searchTerm) ||
      order?.tableNumber?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || payment.status?.toLowerCase() === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod?.toLowerCase() === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetail(true);
  };

  const calculateStats = () => {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const completedPayments = payments.filter(p => p.status?.toLowerCase() === 'completed');
    const totalCompleted = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
      totalPayments: payments.length,
      totalAmount,
      totalCompleted,
      completedCount: completedPayments.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-700 rounded"></div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-[#F6B100]">Lịch sử thanh toán</h1>
          <p className="text-[#ababab] mt-2">Xem tất cả giao dịch thanh toán</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng giao dịch</p>
                <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FaCreditCard className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Tổng tiền</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FaMoneyBillWave className="text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Thành công</p>
                <p className="text-2xl font-bold text-white">{stats.completedCount}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FaCreditCard className="text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#262626] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ababab] text-sm">Đã thu</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalCompleted)}</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <FaMoneyBillWave className="text-yellow-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã giao dịch, tên khách, SĐT, số bàn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#262626] border border-[#3a3a3a] rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#262626] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Thành công</option>
              <option value="pending">Chờ xử lý</option>
              <option value="failed">Thất bại</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#262626] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="qr_code">QR Code</option>
            </select>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-[#262626] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {filteredPayments.length > 0 ? (
            <div className="divide-y divide-[#3a3a3a]">
              {filteredPayments.map((payment) => {
                const order = getOrderInfo(payment.orderId);
                return (
                  <div key={payment._id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-lg">
                          {getMethodIcon(payment.paymentMethod)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-white font-medium">
                              {payment.transactionId || `GD${payment._id.slice(-6)}`}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusLabel(payment.status)}
                            </span>
                          </div>
                          <p className="text-[#ababab] text-sm">
                            {order ? `Bàn ${order.tableNumber} • ${order.customerName}` : 'Không có thông tin đơn hàng'}
                          </p>
                          <p className="text-[#ababab] text-sm">
                            {getMethodLabel(payment.paymentMethod)} • {formatCurrency(payment.amount || 0)}
                          </p>
                          <p className="text-[#ababab] text-xs">
                            {new Date(payment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FaCreditCard className="text-4xl text-[#ababab] mx-auto mb-4" />
              <p className="text-[#ababab]">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'Không tìm thấy giao dịch phù hợp' 
                  : 'Chưa có giao dịch nào'
                }
              </p>
            </div>
          )}
        </div>

        {/* Payment Detail Modal */}
        {showPaymentDetail && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Chi tiết giao dịch</h2>
                <button
                  onClick={() => setShowPaymentDetail(false)}
                  className="text-[#ababab] hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#ababab] text-sm">Mã giao dịch</p>
                    <p className="text-white font-medium">
                      {selectedPayment.transactionId || `GD${selectedPayment._id.slice(-6)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Trạng thái</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                      {getStatusLabel(selectedPayment.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Phương thức</p>
                    <p className="text-white font-medium">{getMethodLabel(selectedPayment.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Số tiền</p>
                    <p className="text-white font-medium text-lg text-[#F6B100]">
                      {formatCurrency(selectedPayment.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Ngày giao dịch</p>
                    <p className="text-white font-medium">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Info */}
                {getOrderInfo(selectedPayment.orderId) && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Thông tin đơn hàng</h3>
                    <div className="bg-[#1f1f1f] rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[#ababab] text-sm">Số bàn</p>
                          <p className="text-white font-medium">
                            {getOrderInfo(selectedPayment.orderId).tableNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#ababab] text-sm">Khách hàng</p>
                          <p className="text-white font-medium">
                            {getOrderInfo(selectedPayment.orderId).customerName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#ababab] text-sm">Số điện thoại</p>
                          <p className="text-white font-medium">
                            {getOrderInfo(selectedPayment.orderId).customerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#ababab] text-sm">Tổng đơn hàng</p>
                          <p className="text-white font-medium">
                            {formatCurrency(getOrderInfo(selectedPayment.orderId).totalAmount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentDetail(false)}
                    className="flex-1 bg-[#3a3a3a] text-white py-3 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentHistory; 