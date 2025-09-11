import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEye, FaPrint, FaCalendarAlt, FaTable, FaMoneyBillWave } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosWrapper.get('/api/order');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      enqueueSnackbar('Không thể tải lịch sử đơn hàng', { variant: 'error' });
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
      case 'cancelled': return 'text-red-500 bg-red-900/20';
      case 'preparing': return 'text-blue-500 bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'cancelled': return 'Đã hủy';
      case 'preparing': return 'Đang chuẩn bị';
      default: return status || 'N/A';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm) ||
      order.tableNumber?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handlePrintOrder = (order) => {
    // Implement print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Đơn hàng #${order._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .total { font-weight: bold; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN</h1>
            <p>Đơn hàng #${order._id}</p>
          </div>
          <div class="order-info">
            <p><strong>Bàn:</strong> ${order.tableNumber}</p>
            <p><strong>Khách hàng:</strong> ${order.customerName}</p>
            <p><strong>SĐT:</strong> ${order.customerPhone}</p>
            <p><strong>Ngày:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>Tên món</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          <div class="total">
            <p>Tổng cộng: ${formatCurrency(order.totalAmount)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6"></div>
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
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
          <h1 className="text-3xl font-bold text-[#F6B100]">Lịch sử đơn hàng</h1>
          <p className="text-[#ababab] mt-2">Xem tất cả đơn hàng đã tạo</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách, SĐT, số bàn..."
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
              <option value="pending">Chờ xử lý</option>
              <option value="preparing">Đang chuẩn bị</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-[#262626] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {filteredOrders.length > 0 ? (
            <div className="divide-y divide-[#3a3a3a]">
              {filteredOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <FaTable className="text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-white font-medium">Bàn {order.tableNumber}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-[#ababab] text-sm">
                          {order.customerName} • {order.customerPhone}
                        </p>
                        <p className="text-[#ababab] text-sm">
                          {order.items?.length || 0} món • {formatCurrency(order.totalAmount || 0)}
                        </p>
                        <p className="text-[#ababab] text-xs">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="bg-green-500/20 text-green-400 p-2 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="In hóa đơn"
                      >
                        <FaPrint />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FaTable className="text-4xl text-[#ababab] mx-auto mb-4" />
              <p className="text-[#ababab]">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Không tìm thấy đơn hàng phù hợp' 
                  : 'Chưa có đơn hàng nào'
                }
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Chi tiết đơn hàng</h2>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-[#ababab] hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#ababab] text-sm">Số bàn</p>
                    <p className="text-white font-medium">{selectedOrder.tableNumber}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Trạng thái</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Khách hàng</p>
                    <p className="text-white font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Số điện thoại</p>
                    <p className="text-white font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Ngày tạo</p>
                    <p className="text-white font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#ababab] text-sm">Tổng tiền</p>
                    <p className="text-white font-medium text-lg text-[#F6B100]">
                      {formatCurrency(selectedOrder.totalAmount || 0)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-white font-medium mb-3">Danh sách món ăn</h3>
                  <div className="bg-[#1f1f1f] rounded-lg p-4">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-[#3a3a3a] last:border-b-0">
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-[#ababab] text-sm">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-white font-medium">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handlePrintOrder(selectedOrder)}
                    className="flex-1 bg-[#F6B100] text-[#1a1a1a] py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPrint />
                    In hóa đơn
                  </button>
                  <button
                    onClick={() => setShowOrderDetail(false)}
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

export default OrderHistory; 