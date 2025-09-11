import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FaClock, FaCheck, FaTimes, FaBell } from 'react-icons/fa';
import { axiosWrapper } from '../https/axiosWrapper';
import { updateOrderStatus } from '../https';
import { enqueueSnackbar } from 'notistack';
import { formatDateAndTime } from '../utils';
import { useSocket } from '../contexts/SocketContext';
import BottomNav from '../components/shared/BottomNav';

const KitchenDisplay = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    document.title = "POS | Kitchen Display";
  }, []);

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const response = await axiosWrapper.get('/api/order');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('new-order', () => {
        queryClient.invalidateQueries(['kitchen-orders']);
      });

      socket.on('order-updated', () => {
        queryClient.invalidateQueries(['kitchen-orders']);
      });

      return () => {
        socket.off('new-order');
        socket.off('order-updated');
      };
    }
  }, [socket, queryClient]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => updateOrderStatus({ orderId, orderStatus }),
    onSuccess: () => {
      enqueueSnackbar('Order status updated!', { variant: 'success' });
      queryClient.invalidateQueries(['kitchen-orders']);
    },
    onError: () => {
      enqueueSnackbar('Failed to update order status!', { variant: 'error' });
    },
  });

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, orderStatus: newStatus });
  };

  // Filter orders based on selected status
  const getFilteredOrders = () => {
    if (!ordersData?.data) return [];
    
    const orders = ordersData.data;
    if (selectedStatus === 'all') {
      return orders.filter(order => 
        order.orderStatus === 'Pending' || 
        order.orderStatus === 'In Progress'
      );
    }
    return orders.filter(order => order.orderStatus === selectedStatus);
  };

  const filteredOrders = getFilteredOrders();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Completed': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeDiff = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ${diffMins % 60} min ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B100]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
      {/* Header */}
      <div className="bg-[#262626] shadow-lg p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#F6B100]">Kitchen Display</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <FaBell className="text-xl text-[#F6B100]" />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'all' 
                  ? 'bg-[#F6B100] text-black' 
                  : 'bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]'
              }`}
            >
              Active Orders ({filteredOrders.length})
            </button>
            <button
              onClick={() => setSelectedStatus('Pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'Pending' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus('In Progress')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'In Progress' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FaClock className="text-6xl text-[#ababab] mx-auto mb-4" />
            <p className="text-xl text-[#ababab]">No active orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-[#262626] rounded-lg border border-[#3a3a3a] overflow-hidden hover:border-[#F6B100] transition-all"
              >
                {/* Order Header */}
                <div className={`p-3 ${getStatusColor(order.orderStatus)}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">Table {order.tableNumber || 'N/A'}</h3>
                      <p className="text-sm opacity-90">{getTimeDiff(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Order #{order._id.slice(-6)}</p>
                      <p className="text-xs">{order.customerDetails?.name || 'Guest'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.name}</p>
                          {item.notes && (
                            <p className="text-xs text-[#ababab] italic">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-[#F6B100] font-bold ml-2">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.orderStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'In Progress')}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <FaClock /> Start
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    {order.orderStatus === 'In Progress' && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Completed')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCheck /> Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default KitchenDisplay;
