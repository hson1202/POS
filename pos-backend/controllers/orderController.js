const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const MenuItem = require("../models/menuItemModel");
const { default: mongoose } = require("mongoose");
const { notifyKitchen, notifyOrderUpdate } = require("../config/socket");

const addOrder = async (req, res, next) => {
  try {
    console.log('Order data received:', req.body);
    
    // Ensure new orders always have "Pending" status
    const orderData = {
      ...req.body,
      orderStatus: "Pending" // Force Pending status for new orders
    };
    
    console.log('Order data with forced status:', orderData);
    
    const order = new Order(orderData);
    await order.save();
    
    // Automatically deduct inventory when creating order
    if (order.items && order.items.length > 0) {
      const stockTransactions = [];
      
      for (const item of order.items) {
        if (item.menuItemId && item.quantity) {
          try {
            // Check meal preparation capability
            const menuItem = await MenuItem.findById(item.menuItemId)
              .populate('recipe.ingredient');
            
            if (menuItem && menuItem.recipe && menuItem.recipe.length > 0) {
              // Check stock for each ingredient
              for (const recipeItem of menuItem.recipe) {
                if (recipeItem.ingredient) {
                  const ingredient = recipeItem.ingredient;
                  const requiredQuantity = recipeItem.quantity * item.quantity;
                  
                  if (ingredient.currentStock < requiredQuantity) {
                    return res.status(400).json({
                      success: false,
                      message: `Insufficient ingredients: ${ingredient.name} (needed: ${requiredQuantity}${ingredient.unit}, available: ${ingredient.currentStock}${ingredient.unit})`
                    });
                  }
                }
              }
              
              // Deduct ingredient inventory
              for (const recipeItem of menuItem.recipe) {
                if (recipeItem.ingredient) {
                  const ingredient = recipeItem.ingredient;
                  const requiredQuantity = recipeItem.quantity * item.quantity;
                  
                  ingredient.currentStock -= requiredQuantity;
                  await ingredient.save();
                  
                  stockTransactions.push({
                    ingredient: ingredient.name,
                    quantity: requiredQuantity,
                    unit: ingredient.unit
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error when deducting inventory for item:', item.name, error);
            // Don't stop order creation process if there's inventory deduction error
          }
        }
      }
      
      // Add inventory transaction info to response
      order.stockTransactions = stockTransactions;
    }
    
    // Notify kitchen about new order
    notifyKitchen({
      _id: order._id,
      tableNumber: order.tableNumber || order.table,
      items: order.items,
      customerDetails: order.customerDetails,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount
    });
    
    res
      .status(201)
      .json({ 
        success: true, 
        message: "Order created!", 
        data: order 
      });
  } catch (error) {
    console.error('Error creating order:', error);
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    // Update all orders without status to "Pending"
    const updateResult = await Order.updateMany(
      { orderStatus: { $exists: false } },
      { orderStatus: "Pending" }
    );
    
    console.log('Updated orders without status:', updateResult);
    
    // Cũng cập nhật orders có status null hoặc undefined
    const updateNullResult = await Order.updateMany(
      { orderStatus: { $in: [null, undefined, ""] } },
      { orderStatus: "Pending" }
    );
    
    // Cập nhật orders có status "pending" (viết thường) thành "Pending" (viết hoa)
    const updateLowercaseResult = await Order.updateMany(
      { orderStatus: "pending" },
      { orderStatus: "Pending" }
    );
    
    console.log('Updated orders with lowercase pending:', updateLowercaseResult);
    
    console.log('Updated orders with null/undefined status:', updateNullResult);
    
    const orders = await Order.find().populate("table");
    
    // Thêm thông tin để phân biệt order của admin và khách vãng lai
    const ordersWithInfo = orders.map(order => {
      const orderObj = order.toObject();
      
      // Nếu không có user field, đây là order của khách vãng lai
      if (!orderObj.user) {
        orderObj.orderType = "Guest";
        orderObj.customerName = orderObj.customerDetails?.name || "Guest";
        orderObj.customerPhone = orderObj.customerDetails?.phone || "N/A";
      } else {
        orderObj.orderType = "Admin";
      }
      
      return orderObj;
    });
    
    res.status(200).json({ data: ordersWithInfo });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // Notify about order status update
    notifyOrderUpdate({
      _id: order._id,
      tableNumber: order.tableNumber || order.table,
      orderStatus: order.orderStatus,
      items: order.items,
      updatedAt: order.updatedAt
    });

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

const fixOrdersStatus = async (req, res, next) => {
  try {
    console.log('Fixing orders status...');
    
    // Tìm tất cả orders không có status hoặc có status lỗi
    const ordersWithoutStatus = await Order.find({
      $or: [
        { orderStatus: { $exists: false } },
        { orderStatus: null },
        { orderStatus: undefined },
        { orderStatus: "" },
        { orderStatus: "pending" } // Cũng fix orders có status "pending" (viết thường)
      ]
    });
    
    console.log('Orders without proper status:', ordersWithoutStatus.length);
    
    // Update tất cả orders này thành "Pending"
    const updateResult = await Order.updateMany(
      {
        $or: [
          { orderStatus: { $exists: false } },
          { orderStatus: null },
          { orderStatus: undefined },
          { orderStatus: "" },
          { orderStatus: "pending" } // Cũng update orders có status "pending" (viết thường)
        ]
      },
      { orderStatus: "Pending" }
    );
    
    console.log('Update result:', updateResult);
    
    res.status(200).json({
      success: true,
      message: `Fixed ${updateResult.modifiedCount} orders`,
      data: {
        ordersFound: ordersWithoutStatus.length,
        ordersUpdated: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error fixing orders status:', error);
    next(error);
  }
};

// Get popular dishes based on order data
const getPopularDishes = async (req, res, next) => {
  try {
    const orders = await Order.find({ orderStatus: 'Completed' });
    
    // Aggregate dish counts from orders
    const dishCounts = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.menuItemId || item.name;
        if (key) {
          if (!dishCounts[key]) {
            dishCounts[key] = {
              id: key,
              name: item.name,
              count: 0,
              revenue: 0
            };
          }
          dishCounts[key].count += item.quantity || 1;
          dishCounts[key].revenue += item.totalPrice || 0;
        }
      });
    });
    
    // Convert to array and sort by count
    const popularDishes = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 dishes
    
    res.status(200).json({
      success: true,
      data: popularDishes
    });
  } catch (error) {
    console.error('Error fetching popular dishes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy món ăn phổ biến',
      error: error.message
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const [orders, users, ingredients] = await Promise.all([
      Order.find(),
      require('../models/userModel').find(),
      require('../models/ingredientModel').find()
    ]);
    
    // Calculate order stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.orderStatus?.toLowerCase() === 'completed').length;
    const pendingOrders = orders.filter(order => order.orderStatus?.toLowerCase() === 'pending').length;
    const totalRevenue = orders
      .filter(order => order.orderStatus?.toLowerCase() === 'completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    // Calculate low stock items
    const lowStockItems = ingredients.filter(item => 
      item.currentStock <= (item.minStock || 0)
    );
    
    // Calculate table stats (assuming table numbers are used)
    const tableNumbers = [...new Set(orders.map(order => order.tableNumber))];
    const totalTables = tableNumbers.length;
    const occupiedTables = orders.filter(order => 
      order.orderStatus?.toLowerCase() === 'pending'
    ).map(order => order.tableNumber);
    const uniqueOccupiedTables = [...new Set(occupiedTables)];
    
    const stats = {
      totalUsers: users.length,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue,
      totalTables,
      occupiedTables: uniqueOccupiedTables.length,
      availableTables: totalTables - uniqueOccupiedTables.length,
      recentOrders,
      lowStockItems,
      dailyRevenue: calculateDailyRevenue(orders),
      weeklyRevenue: calculateWeeklyRevenue(orders),
      monthlyRevenue: calculateMonthlyRevenue(orders)
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

// Helper functions for revenue calculations
const calculateDailyRevenue = (orders) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return orders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow && 
             order.orderStatus?.toLowerCase() === 'completed';
    })
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
};

const calculateWeeklyRevenue = (orders) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return orders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekAgo && orderDate <= today && 
             order.orderStatus?.toLowerCase() === 'completed';
    })
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
};

const calculateMonthlyRevenue = (orders) => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  return orders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthAgo && orderDate <= today && 
             order.orderStatus?.toLowerCase() === 'completed';
    })
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
};

module.exports = { 
  addOrder, 
  getOrderById, 
  getOrders, 
  updateOrder, 
  fixOrdersStatus, 
  getDashboardStats,
  getPopularDishes
};
