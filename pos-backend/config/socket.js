const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room based on user role
    socket.on('join-room', (data) => {
      const { role, userId } = data;
      if (role === 'kitchen' || role === 'chef') {
        socket.join('kitchen');
        console.log(`User ${userId} joined kitchen room`);
      }
      if (role === 'admin' || role === 'manager') {
        socket.join('management');
        console.log(`User ${userId} joined management room`);
      }
      socket.join('staff'); // All staff members
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit new order notification to kitchen
const notifyKitchen = (orderData) => {
  if (io) {
    io.to('kitchen').emit('new-order', orderData);
    io.to('management').emit('new-order', orderData);
    console.log('Notified kitchen about new order:', orderData._id);
  }
};

// Emit order status update
const notifyOrderUpdate = (orderData) => {
  if (io) {
    io.emit('order-updated', orderData);
    console.log('Notified about order update:', orderData._id);
  }
};

// Emit table status update
const notifyTableUpdate = (tableData) => {
  if (io) {
    io.emit('table-updated', tableData);
    console.log('Notified about table update:', tableData._id || tableData.tableNo);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  notifyKitchen,
  notifyOrderUpdate,
  notifyTableUpdate
};
