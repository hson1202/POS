import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { enqueueSnackbar } from 'notistack';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { id: userId, role } = useSelector(state => state.user);
  
  const MAX_RECONNECT_ATTEMPTS = 3;

  useEffect(() => {
    // Prevent socket connection on customer table routes
    if (window.location.pathname.startsWith('/table/')) {
      console.log('🚫 Skipping socket connection for customer table route');
      return;
    }
    
    if (userId && role && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Initialize socket connection
      // Get socket URL (same as backend URL)
      const getSocketURL = () => {
        if (import.meta.env.VITE_BACKEND_URL) {
          return import.meta.env.VITE_BACKEND_URL;
        }
        if (import.meta.env.VITE_SOCKET_URL) {
          return import.meta.env.VITE_SOCKET_URL;
        }
        return 'http://localhost:3000';
      };
      
      const socketURL = getSocketURL();
      console.log('🔌 Socket connecting to:', socketURL);
      
      const newSocket = io(socketURL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join appropriate rooms based on role
        newSocket.emit('join-room', { role, userId });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        setReconnectAttempts(prev => prev + 1);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setReconnectAttempts(prev => prev + 1);
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log('🛑 Max reconnection attempts reached, stopping socket');
          newSocket.close();
        }
      });

      // Handle new order notifications
      newSocket.on('new-order', (orderData) => {
        console.log('New order received:', orderData);
        
        // Play notification sound
        const audio = new Audio('/audio/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        // Show notification
        enqueueSnackbar(`🍳 New order from Table ${orderData.tableNumber}!`, {
          variant: 'info',
          autoHideDuration: 5000,
        });

        // Show desktop notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('New Order!', {
            body: `Table ${orderData.tableNumber} - ${orderData.items?.length || 0} items`,
            icon: '/logo.png',
          });
        }
      });

      // Handle order updates
      newSocket.on('order-updated', (orderData) => {
        console.log('Order updated:', orderData);
        
        if (orderData.orderStatus === 'Completed') {
          enqueueSnackbar(`✅ Order ${orderData._id} completed!`, {
            variant: 'success',
            autoHideDuration: 3000,
          });
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [userId, role, reconnectAttempts]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
