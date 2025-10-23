import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaEye } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../https";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime, generateShortOrderId } from "../../utils";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { printBill, printCompactBill } from "../../utils/billTemplates";

const NotificationBell = ({ className = "" }) => {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [audio] = useState(new Audio('/audio/notification.mp3'));
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const { data: resData, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    refetchInterval: socket && socket.connected ? 30000 : 5000, // More frequent polling when socket is disconnected
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to socket events for real-time notifications
  useEffect(() => {
    if (socket) {
      console.log('🔔 Setting up socket listeners, socket connected:', socket.connected);
      
      const handleNewOrder = (orderData) => {
        console.log('🆕 Received new-order event:', orderData);
        const now = Date.now();
        
        // Prevent duplicate notifications within 2 seconds
        if (now - lastNotificationTime < 2000) {
          console.log('⚠️ Duplicate notification prevented');
          return;
        }
        
        setLastNotificationTime(now);
        setNewOrderCount(prev => prev + 1);
        
        // Different message for new order vs added items
        const isNewOrder = orderData.isNewOrder !== false; // Default to true
        const itemsCount = orderData.addedItemsCount || orderData.items?.length || 0;
        
        let message;
        if (isNewOrder) {
          message = `Đơn hàng mới từ ${orderData.customerDetails?.name || 'Khách'} - Bàn ${orderData.tableNumber}`;
        } else {
          message = `${orderData.customerDetails?.name || 'Khách'} đã thêm ${itemsCount} món - Bàn ${orderData.tableNumber}`;
        }
        
        // Add new notification
        const newNotification = {
          id: `${orderData._id}-${now}`, // Unique ID to allow multiple notifications for same order
          type: isNewOrder ? 'new_order' : 'added_items',
          message: message,
          orderId: orderData._id,
          timestamp: new Date(),
          read: false,
          isNewOrder
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Play notification sound
        try {
          audio.play();
        } catch (error) {
          console.log("Audio play failed:", error);
        }
        
        // Show desktop notification
        if (Notification.permission === "granted") {
          new Notification("Có đơn hàng mới!", {
            body: `Đơn từ bàn ${orderData.tableNumber}`,
            icon: "/logo.png",
            badge: "/logo.png",
          });
        }
        
        // Show snackbar notification
        if (isNewOrder) {
          enqueueSnackbar(`🆕 Đơn hàng mới từ bàn ${orderData.tableNumber}!`, {
            variant: "success",
            autoHideDuration: 3000,
          });
        } else {
          enqueueSnackbar(`➕ Bàn ${orderData.tableNumber} đã thêm ${itemsCount} món!`, {
            variant: "info",
            autoHideDuration: 3000,
          });
        }
        
        // Auto-print kitchen bill for admin (only admin receives socket notifications)
        try {
          // Create order object in the format expected by printBill
          const order = {
            _id: orderData._id,
            customerDetails: orderData.customerDetails,
            customerName: orderData.customerDetails?.name,
            customerPhone: orderData.customerDetails?.phone,
            tableNumber: orderData.tableNumber,
            table: orderData.tableNumber,
            items: isNewOrder ? orderData.items : orderData.items, // Use items (new items only for add-ons)
            allItems: orderData.allItems, // All items for reference
            totalAmount: orderData.totalAmount,
            orderStatus: 'Pending', // New orders are always pending
            createdAt: orderData.createdAt || new Date().toISOString(),
            isNewOrder: isNewOrder,
            addedItemsCount: itemsCount
          };
          
          // Print compact kitchen bill for thermal printer (will automatically use kitchen template since status is Pending)
          printCompactBill(order);
          
          if (isNewOrder) {
            console.log('✅ Kitchen bill printed automatically for new order');
          } else {
            console.log(`✅ Additional items bill printed (${itemsCount} items)`);
          }
        } catch (error) {
          console.error('Auto-print kitchen bill failed:', error);
          // Don't show error to user as this is automatic
        }
        
        // Refresh orders data
        refetch();
      };

      socket.on('new-order', handleNewOrder);
      
      return () => {
        socket.off('new-order', handleNewOrder);
      };
    }
  }, [socket, audio, lastNotificationTime, refetch]);

  // Load pending orders on mount and convert them to notifications
  useEffect(() => {
    if (resData?.data?.data) {
      const orders = resData.data.data;
      
      // Filter pending orders only
      const pendingOrders = orders.filter(order => 
        order.orderStatus === 'Pending' || order.orderStatus === 'pending'
      );
      
      // Set notifications with functional update to access prev state
      setNotifications(prev => {
        // Create map of existing notifications (includes both socket and DB notifications)
        const existingNotificationsMap = new Map();
        prev.forEach(n => {
          existingNotificationsMap.set(n.orderId, n);
        });
        
        // Process pending orders
        const newOrderIds = [];
        const updatedNotifications = pendingOrders.map(order => {
          const existing = existingNotificationsMap.get(order._id);
          
          if (existing) {
            // Keep existing notification with preserved read status and type
            return existing;
          } else {
            // New notification - only if not in previous notifications
            newOrderIds.push(order._id);
            return {
              id: order._id,
              type: 'pending_order',
              message: `Đơn đang chờ từ ${order.customerDetails?.name || order.customerName || 'Khách'} - Bàn ${order.tableNumber || order.table || 'N/A'}`,
              orderId: order._id,
              timestamp: new Date(order.createdAt),
              read: false
            };
          }
        });
        
        // Update count for new notifications
        if (newOrderIds.length > 0) {
          setNewOrderCount(prevCount => prevCount + newOrderIds.length);
          console.log(`Added ${newOrderIds.length} new pending orders as notifications`);
        }
        
        // Sort by timestamp, newest first
        return updatedNotifications.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
      });
    }
  }, [resData?.data?.data]);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (newOrderCount > 0) {
      setNewOrderCount(0); // Clear new order count when opening
      // Mark all notifications as read
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }
  };

  const handleViewOrder = (orderId) => {
    // Navigate to orders page and scroll to the specific order
    navigate('/orders');
    setShowDropdown(false);
    
    // Add a small delay to ensure the orders page is loaded
    setTimeout(() => {
      // Hiển thị thông báo điều hướng
      enqueueSnackbar(`Đã chuyển đến trang Đơn hàng. Tìm mã đơn: #${generateShortOrderId(orderId)}`, {
        variant: "info",
        autoHideDuration: 3000,
      });
    }, 500);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNewOrderCount(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={handleBellClick}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <FaBell className="text-[#f5f5f5] text-lg" />
            {(newOrderCount > 0 || unreadCount > 0) && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                {newOrderCount > 0 ? newOrderCount : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[#f5f5f5] text-sm font-medium">
            {newOrderCount > 0 ? `${newOrderCount} đơn hàng mới` : 
             unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Không có đơn mới'}
          </span>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#2a2a2a] z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <h3 className="text-[#f5f5f5] font-semibold">Thông báo</h3>
              {/* Socket connection status indicator */}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={isConnected ? 'Kết nối real-time' : 'Mất kết nối real-time'}></div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[#ababab] hover:text-red-400 text-sm"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={`${notification.id}-${index}`}
                  className={`p-4 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors cursor-pointer ${
                    !notification.read ? 'bg-[#2a2a2a]' : ''
                  }`}
                  onClick={() => handleViewOrder(notification.orderId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#f5f5f5] text-sm font-medium mb-1">
                        {notification.message}
                      </p>
                      <p className="text-[#ababab] text-xs">
                        {formatDateAndTime(notification.timestamp)}
                      </p>
                      {notification.type === 'new_order' && (
                        <p className="text-[#025cca] text-xs font-mono mt-1">
                          Mã đơn: #{generateShortOrderId(notification.orderId)}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 p-1 text-[#ababab]">
                      <FaEye size={12} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FaBell className="text-[#ababab] text-2xl mx-auto mb-2" />
                <p className="text-[#ababab] text-sm">Chưa có thông báo</p>
                <p className="text-[#666] text-xs mt-1">Đơn hàng mới sẽ hiển thị tại đây</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 