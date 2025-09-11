import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaEye } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../https";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime, generateShortOrderId } from "../../utils";
import { useNavigate } from "react-router-dom";

const NotificationBell = ({ className = "" }) => {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [audio] = useState(new Audio('/audio/notification.mp3'));
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data: resData, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    refetchInterval: 5000, // Auto refresh every 5 seconds
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

  // Check for new orders
  useEffect(() => {
    if (resData?.data?.data) {
      const currentOrderCount = resData.data.data.length;
      
      if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
        const newOrders = currentOrderCount - lastOrderCount;
        setNewOrderCount(prev => prev + newOrders);
        
        // Add new notifications
        const newNotifications = resData.data.data
          .slice(-newOrders)
          .map(order => ({
            id: order._id,
            type: 'new_order',
            message: `New order from ${order.customerDetails?.name || 'Guest'} - Table ${order.table}`,
            orderId: order._id,
            timestamp: new Date(),
            read: false
          }));
        
        setNotifications(prev => [...newNotifications, ...prev]);
        
        // Play notification sound
        try {
          audio.play();
        } catch (error) {
          console.log("Audio play failed:", error);
        }
        
        // Show desktop notification
        if (Notification.permission === "granted") {
          new Notification("New Order Received!", {
            body: `${newOrders} new order${newOrders > 1 ? 's' : ''} received!`,
            icon: "/logo.png",
            badge: "/logo.png",
          });
        }
        
        // Show snackbar notification
        enqueueSnackbar(`🆕 ${newOrders} new order${newOrders > 1 ? 's' : ''} received!`, {
          variant: "success",
          autoHideDuration: 3000,
        });
      }
      
      setLastOrderCount(currentOrderCount);
    }
  }, [resData?.data?.data, lastOrderCount, audio]);

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
      // You can add logic here to highlight or scroll to the specific order
      // For now, just show a message
      enqueueSnackbar(`Navigated to Orders page. Look for Order ID: #${generateShortOrderId(orderId)}`, {
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
            {newOrderCount > 0 ? `${newOrderCount} New Order${newOrderCount > 1 ? 's' : ''}` : 
             unreadCount > 0 ? `${unreadCount} Unread` : 'No New Orders'}
          </span>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#2a2a2a] z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <h3 className="text-[#f5f5f5] font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[#ababab] hover:text-red-400 text-sm"
                >
                  Clear all
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
                          Order ID: #{generateShortOrderId(notification.orderId)}
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
                <p className="text-[#ababab] text-sm">No notifications yet</p>
                <p className="text-[#666] text-xs mt-1">New orders will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 