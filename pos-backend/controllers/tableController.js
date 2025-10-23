const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose")

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats = 4 } = req.body; // Default 4 seats nếu không có
    if (!tableNo) {
      const error = createHttpError(400, "Please provide table No!");
      return next(error);
    }
    const isTablePresent = await Table.findOne({ tableNo });

    if (isTablePresent) {
      const error = createHttpError(400, "Table already exist!");
      return next(error);
    }

    const newTable = new Table({ tableNo, seats });
    await newTable.save();
    res
      .status(201)
      .json({ success: true, message: "Table added!", data: newTable });
  } catch (error) {
    next(error);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails items bills orderStatus orderDate notes bookingTime reservationDateTime"
    });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let tableId = id;
    
    // If id is not a valid ObjectId, try to find by tableNo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const tableNo = parseInt(id);
      if (isNaN(tableNo)) {
        const error = createHttpError(404, "Invalid table ID or table number!");
        return next(error);
      }
      
      // Find table by tableNo
      const tableByNo = await Table.findOne({ tableNo });
      if (!tableByNo) {
        const error = createHttpError(404, `Table ${tableNo} not found!`);
        return next(error);
      }
      
      tableId = tableByNo._id;
    }

    const table = await Table.findById(tableId).populate({
      path: "currentOrder",
      select: "customerDetails items bills orderStatus orderDate notes bookingTime"
    });

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { status, orderId, currentOrder } = req.body;
    const { id } = req.params;

    let tableId = id;
    
    // If id is not a valid ObjectId, try to find by tableNo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const tableNo = parseInt(id);
      if (isNaN(tableNo)) {
        const error = createHttpError(404, "Invalid table ID or table number!");
        return next(error);
      }
      
      // Find table by tableNo
      const tableByNo = await Table.findOne({ tableNo });
      if (!tableByNo) {
        const error = createHttpError(404, `Table ${tableNo} not found!`);
        return next(error);
      }
      
      tableId = tableByNo._id;
      console.log(`🔄 Converted tableNo ${tableNo} to ObjectId ${tableId}`);
    }

    // If currentOrder is provided (for booking), create an order first
    let orderIdToUse = orderId;
    if (currentOrder && currentOrder.customerDetails) {
      const Order = require("../models/orderModel");
      const newOrder = new Order({
        customerDetails: currentOrder.customerDetails,
        orderStatus: "Booked",
        bills: { total: 0, tax: 0, totalWithTax: 0 },
        items: [],
        table: tableId, // <-- dùng ObjectId
        notes: currentOrder.notes,
        bookingTime: currentOrder.bookingTime,
        reservationDateTime: currentOrder.reservationDateTime
      });
      const savedOrder = await newOrder.save();
      orderIdToUse = savedOrder._id;
    }
    

    const table = await Table.findByIdAndUpdate(
        tableId,
      { status, currentOrder: orderIdToUse },
      { new: true }
    ).populate({
      path: "currentOrder",
      select: "customerDetails items bills orderStatus orderDate notes bookingTime reservationDateTime"
    });

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return next(error);
    }

    res.status(200).json({success: true, message: "Table updated!", data: table});

  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    let tableId = id;
    
    // If id is not a valid ObjectId, try to find by tableNo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const tableNo = parseInt(id);
      if (isNaN(tableNo)) {
        const error = createHttpError(404, "Invalid table ID or table number!");
        return next(error);
      }
      
      // Find table by tableNo
      const tableByNo = await Table.findOne({ tableNo });
      if (!tableByNo) {
        const error = createHttpError(404, `Table ${tableNo} not found!`);
        return next(error);
      }
      
      tableId = tableByNo._id;
    }

    // Check if table has active orders
    const table = await Table.findById(tableId).populate('currentOrder');
    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return next(error);
    }

    // Check if table is currently occupied or has active orders
    if (table.status === "Occupied" || (table.currentOrder && table.currentOrder.orderStatus !== "completed")) {
      const error = createHttpError(400, "Cannot delete table with active orders!");
      return next(error);
    }

    // Delete the table
    await Table.findByIdAndDelete(tableId);

    res.status(200).json({
      success: true, 
      message: `Table ${table.tableNo} deleted successfully!`
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { addTable, getTables, getTableById, updateTable, deleteTable };
