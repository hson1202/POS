const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose")

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;
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
      select: "customerDetails items bills orderStatus orderDate"
    });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { status, orderId, currentOrder } = req.body;

    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        const error = createHttpError(404, "Invalid id!");
        return next(error);
    }

    // If currentOrder is provided (for booking), create an order first
    let orderIdToUse = orderId;
    if (currentOrder && currentOrder.customerDetails) {
      const Order = require("../models/orderModel");
      const newOrder = new Order({
        customerDetails: currentOrder.customerDetails,
        orderStatus: "booked",
        bills: { total: 0, tax: 0, totalWithTax: 0 },
        items: [],
        table: id,
        notes: currentOrder.notes,
        bookingTime: currentOrder.bookingTime
      });
      const savedOrder = await newOrder.save();
      orderIdToUse = savedOrder._id;
    }

    const table = await Table.findByIdAndUpdate(
        id,
      { status, currentOrder: orderIdToUse },
      { new: true }
    ).populate({
      path: "currentOrder",
      select: "customerDetails items bills orderStatus orderDate notes bookingTime"
    });

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return error;
    }

    res.status(200).json({success: true, message: "Table updated!", data: table});

  } catch (error) {
    next(error);
  }
};

module.exports = { addTable, getTables, updateTable };
