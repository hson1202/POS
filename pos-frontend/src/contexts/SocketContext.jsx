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
  const { id: userId, role } = useSelector(state => state.user);

  useEffect(() => {
    if (userId && role) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        withCredentials: true,
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
  }, [userId, role]);

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
