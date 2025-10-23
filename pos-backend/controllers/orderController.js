const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const MenuItem = require("../models/menuItemModel");
const { default: mongoose } = require("mongoose");
const { notifyKitchen, notifyOrderUpdate, notifyTableUpdate } = require("../config/socket");

const addOrder = async (req, res, next) => {
  try {
    console.log('Order data received:', req.body);
    
    const orderData = {
      ...req.body,
      orderStatus: "Pending" // Force Pending status for new orders
    };
    
    console.log('Order data with forced status:', orderData);
    
    // Check if table already has a pending order
    let order;
    let isNewOrder = true;
    let addedItems = orderData.items || [];
    let shouldUpdateTableStatus = false;
    
    if (orderData.table || orderData.tableNumber) {
      const tableIdentifier = orderData.table || orderData.tableNumber;
      
      // Find existing active order for this table (not completed)
      // Customer can keep adding items until staff marks order as "Completed"
      const existingOrder = await Order.findOne({
        $or: [
          { table: tableIdentifier },
          { tableNumber: tableIdentifier }
        ],
        orderStatus: { $nin: ["Completed", "completed"] } // Merge all except Completed
      }).sort({ createdAt: -1 }); // Get latest active order
      
      if (existingOrder) {
        console.log(`Found existing active order (${existingOrder.orderStatus}) for table ${tableIdentifier}:`, existingOrder._id);
        
        // If existing order is "Booked" and items are being added, change status to "Pending"
        // This means customer has arrived and is ordering
        if (existingOrder.orderStatus === "Booked" && addedItems.length > 0) {
          existingOrder.orderStatus = "Pending";
          shouldUpdateTableStatus = true; // Update table status to Occupied
          console.log(`✅ Changed order status from Booked to Pending (customer arrived and ordering)`);
        }
        
        // Merge items: append new items to existing order
        const existingItems = existingOrder.items || [];
        const mergedItems = [...existingItems, ...addedItems];
        
        // Update totals
        const newTotal = (existingOrder.bills?.totalWithTax || 0) + (orderData.bills?.totalWithTax || 0);
        
        existingOrder.items = mergedItems;
        existingOrder.bills = {
          total: newTotal,
          tax: 0,
          totalWithTax: newTotal
        };
        existingOrder.totalAmount = newTotal;
        
        // Update customer details if provided (in case guest info changed)
        if (orderData.customerDetails) {
          existingOrder.customerDetails = {
            ...existingOrder.customerDetails,
            ...orderData.customerDetails
          };
        }
        
        await existingOrder.save();
        order = existingOrder;
        isNewOrder = false;
        
        console.log(`✅ Merged ${addedItems.length} items into existing order (Status: ${existingOrder.orderStatus})`);
      } else {
        console.log(`No active order found for table ${tableIdentifier}, creating new order`);
        order = new Order(orderData);
        await order.save();
        shouldUpdateTableStatus = true; // New order with items -> table is occupied
      }
      
      // Auto-update table status to "Occupied" when order has items
      if (shouldUpdateTableStatus && addedItems.length > 0) {
        try {
          const Table = require("../models/tableModel");
          const mongoose = require("mongoose");
          
          // Find table by ID or tableNo
          let table;
          if (mongoose.Types.ObjectId.isValid(tableIdentifier)) {
            table = await Table.findById(tableIdentifier);
          } else {
            table = await Table.findOne({ tableNo: tableIdentifier });
          }
          
          if (table && table.status !== "Occupied") {
            table.status = "Occupied";
            table.currentOrder = order._id;
            await table.save();
            console.log(`✅ Auto-updated table ${tableIdentifier} status to Occupied`);
            
            // Notify about table status change via socket
            notifyTableUpdate({
              _id: table._id,
              tableNo: table.tableNo,
              status: table.status,
              currentOrder: order._id
            });
          }
        } catch (tableUpdateError) {
          console.error('Error auto-updating table status:', tableUpdateError);
          // Don't fail order creation if table update fails
        }
      }
    } else {
      // No table specified, create new order (takeaway/delivery)
      order = new Order(orderData);
      await order.save();
    }
    
    // Automatically deduct inventory - only for newly added items
    if (addedItems && addedItems.length > 0) {
      const stockTransactions = [];
      
      for (const item of addedItems) {
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
    
    // Notify kitchen about new order or added items
    // Resolve table number properly
    const resolvedTableNumber = order.tableNumber || 
      (order.table && typeof order.table === 'object' ? order.table.tableNo : order.table);
    
    if (isNewOrder) {
      notifyKitchen({
        _id: order._id,
        tableNumber: resolvedTableNumber,
        items: order.items,
        customerDetails: order.customerDetails,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        isNewOrder: true
      });
    } else {
      // Notify about added items
      notifyKitchen({
        _id: order._id,
        tableNumber: resolvedTableNumber,
        items: addedItems, // Only new items for kitchen
        allItems: order.items, // All items for reference
        customerDetails: order.customerDetails,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        isNewOrder: false,
        addedItemsCount: addedItems.length
      });
    }
    
    res
      .status(201)
      .json({ 
        success: true, 
        message: isNewOrder ? "Order created!" : `Added ${addedItems.length} items to existing order!`, 
        data: order,
        isNewOrder,
        addedItems
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
      
      // Fix tableNumber display issue - if table is populated, get tableNo
      if (orderObj.table && typeof orderObj.table === 'object') {
        orderObj.tableNumber = orderObj.table.tableNo || orderObj.tableNumber;
      }
      
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
    ).populate('table');

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // If order is completed, auto-release table (set to Available)
    if (orderStatus === "Completed") {
      try {
        const Table = require("../models/tableModel");
        const tableIdentifier = order.table || order.tableNumber;
        
        if (tableIdentifier) {
          let table;
          
          // Find table by ID or tableNo
          if (mongoose.Types.ObjectId.isValid(tableIdentifier)) {
            table = await Table.findById(tableIdentifier);
          } else {
            table = await Table.findOne({ tableNo: tableIdentifier });
          }
          
          // Update table to Available and clear currentOrder
          if (table) {
            table.status = "Available";
            table.currentOrder = null;
            await table.save();
            console.log(`✅ Auto-released table ${tableIdentifier} (Order completed)`);
            
            // Notify about table status change
            notifyTableUpdate({
              _id: table._id,
              tableNo: table.tableNo,
              status: table.status,
              currentOrder: null
            });
          }
        }
      } catch (tableUpdateError) {
        console.error('Error auto-releasing table:', tableUpdateError);
        // Don't fail order update if table release fails
      }
    }

    // Resolve table number properly
    const resolvedTableNumber = order.tableNumber || 
      (order.table && typeof order.table === 'object' ? order.table.tableNo : order.table);

    // Notify about order status update
    notifyOrderUpdate({
      _id: order._id,
      tableNumber: resolvedTableNumber,
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

// Compute total for an order using multiple possible sources
const computeOrderTotal = (order) => {
  if (!order) return 0;
  if (typeof order.totalAmount === 'number') return order.totalAmount;
  if (order.bills && typeof order.bills.totalWithTax === 'number') return order.bills.totalWithTax;
  const items = order.items || [];
  return items.reduce((sum, item) => {
    const quantity = item.quantity || 1;
    const price = item.totalPrice != null ? item.totalPrice
      : item.total != null ? item.total
      : item.price != null ? item.price * quantity
      : item.unitPrice != null ? item.unitPrice * quantity
      : 0;
    return sum + (price || 0);
  }, 0);
};

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const [orders, users, ingredients, payments] = await Promise.all([
      Order.find(),
      require('../models/userModel').find(),
      require('../models/ingredientModel').find(),
      Payment.find()
    ]);
    
    // Calculate order stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.orderStatus?.toLowerCase() === 'completed').length;
    const pendingOrders = orders.filter(order => order.orderStatus?.toLowerCase() === 'pending').length;
    // Prefer revenue from completed payments; fallback to completed orders
    const completedPayments = payments.filter(p => p.status?.toLowerCase() === 'completed');
    const paymentsRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const ordersRevenue = orders
      .filter(order => order.orderStatus?.toLowerCase() === 'completed')
      .reduce((sum, order) => sum + computeOrderTotal(order), 0);
    const totalRevenue = paymentsRevenue > 0 ? paymentsRevenue : ordersRevenue;
    
    // Get recent orders (last 10) with normalized totals
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(o => ({
        _id: o._id,
        tableNumber: o.tableNumber || o.table?.tableNo || (typeof o.table === 'object' ? null : o.table),
        items: o.items || [],
        totalAmount: computeOrderTotal(o),
        orderStatus: o.orderStatus,
        createdAt: o.createdAt
      }));
    
    // Calculate low stock items
    const lowStockItems = ingredients.filter(item => 
      item.currentStock <= (item.minStock || 0)
    );
    
    // Calculate table stats (assuming table numbers are used)
    const tableNumbers = [...new Set(orders.map(order => order.tableNumber || order.table?.tableNo || (typeof order.table === 'object' ? null : order.table)).filter(Boolean))];
    const totalTables = tableNumbers.length;
    const occupiedTables = orders.filter(order => 
      order.orderStatus?.toLowerCase() === 'pending'
    ).map(order => order.tableNumber || order.table?.tableNo || (typeof order.table === 'object' ? null : order.table)).filter(Boolean);
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
      dailyRevenue: calculateDailyPaymentRevenue(completedPayments) || calculateDailyRevenue(orders),
      weeklyRevenue: calculateWeeklyPaymentRevenue(completedPayments) || calculateWeeklyRevenue(orders),
      monthlyRevenue: calculateMonthlyPaymentRevenue(completedPayments) || calculateMonthlyRevenue(orders)
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

// Payment-based revenue helpers
const calculateDailyPaymentRevenue = (payments) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return payments
    .filter(p => {
      const d = new Date(p.createdAt);
      return d >= today && d < tomorrow;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
};

const calculateWeeklyPaymentRevenue = (payments) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return payments
    .filter(p => {
      const d = new Date(p.createdAt);
      return d >= weekAgo && d <= today;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
};

const calculateMonthlyPaymentRevenue = (payments) => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return payments
    .filter(p => {
      const d = new Date(p.createdAt);
      return d >= monthAgo && d <= today;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
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
