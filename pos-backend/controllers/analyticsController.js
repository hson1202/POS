const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const StockTransaction = require("../models/stockTransactionModel");

function getDateRange({ from, to }) {
  const now = new Date();
  let start = from ? new Date(from) : new Date(now);
  let end = to ? new Date(to) : new Date(now);
  if (!from) {
    start.setDate(start.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildDateProjection(groupBy) {
  switch ((groupBy || "day").toLowerCase()) {
    case "year":
      return { year: { $year: "$createdAt" } };
    case "quarter":
      return { year: { $year: "$createdAt" }, quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } } };
    case "month":
      return { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
    case "week":
      return { year: { $isoWeekYear: "$createdAt" }, week: { $isoWeek: "$createdAt" } };
    case "day":
    default:
      return { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };
  }
}

function buildDateSort(groupBy) {
  switch ((groupBy || "day").toLowerCase()) {
    case "year": return { "_id.year": 1 };
    case "quarter": return { "_id.year": 1, "_id.quarter": 1 };
    case "month": return { "_id.year": 1, "_id.month": 1 };
    case "week": return { "_id.year": 1, "_id.week": 1 };
    case "day":
    default:
      return { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
  }
}

function formatBucketLabel(id) {
  // Format: DD/MM/YYYY for day, MM/YYYY for month, etc.
  if (id.day) return `${String(id.day).padStart(2, "0")}/${String(id.month).padStart(2, "0")}/${id.year}`;
  if (id.week) return `Tuần ${id.week}/${id.year}`;
  if (id.month) return `${String(id.month).padStart(2, "0")}/${id.year}`;
  if (id.quarter) return `Q${id.quarter}/${id.year}`;
  return `${id.year}`;
}

function parseLabelForSorting(label) {
  // Parse Vietnamese date labels back to sortable format
  // DD/MM/YYYY -> YYYY-MM-DD
  if (label.includes('/') && label.split('/').length === 3) {
    const [d, m, y] = label.split('/');
    return `${y}-${m}-${d}`;
  }
  // MM/YYYY -> YYYY-MM
  if (label.includes('/') && label.split('/').length === 2) {
    const [m, y] = label.split('/');
    return `${y}-${m}`;
  }
  // Tuần X/YYYY -> YYYY-WX
  if (label.startsWith('Tuần')) {
    const [_, rest] = label.split(' ');
    const [w, y] = rest.split('/');
    return `${y}-W${String(w).padStart(2, '0')}`;
  }
  // Q1/YYYY -> YYYY-Q1
  if (label.startsWith('Q')) {
    const [q, y] = label.split('/');
    return `${y}-${q}`;
  }
  return label; // Year only
}

function sortSeriesByLabel(series) {
  return series.sort((a, b) => parseLabelForSorting(a.label).localeCompare(parseLabelForSorting(b.label)));
}

const getRevenue = async (req, res, next) => {
  try {
    const { start, end } = getDateRange({ from: req.query.from, to: req.query.to });
    const groupBy = req.query.groupBy || "day";
    const projection = buildDateProjection(groupBy);

    const paymentPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ["completed", "Completed"] } } },
      { $group: { _id: projection, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: buildDateSort(groupBy) }
    ];

    const orderPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end }, orderStatus: { $in: ["Completed", "completed"] } } },
      { $group: { _id: projection, amount: { $sum: { $ifNull: ["$totalAmount", 0] } }, count: { $sum: 1 } } },
      { $sort: buildDateSort(groupBy) }
    ];

    const [paymentAgg, orderAgg] = await Promise.all([
      Payment.aggregate(paymentPipeline),
      Order.aggregate(orderPipeline)
    ]);

    const paymentSeries = paymentAgg.map(d => ({ label: formatBucketLabel(d._id), amount: d.amount, count: d.count }));
    const orderSeries = orderAgg.map(d => ({ label: formatBucketLabel(d._id), amount: d.amount, count: d.count }));

    const merged = new Map();
    for (const row of orderSeries) {
      merged.set(row.label, { label: row.label, orderAmount: row.amount, orderCount: row.count, paymentAmount: 0, paymentCount: 0 });
    }
    for (const row of paymentSeries) {
      if (!merged.has(row.label)) merged.set(row.label, { label: row.label, orderAmount: 0, orderCount: 0, paymentAmount: 0, paymentCount: 0 });
      const prev = merged.get(row.label);
      prev.paymentAmount = row.amount;
      prev.paymentCount = row.count;
      merged.set(row.label, prev);
    }

    // Convert to array and sort chronologically
    const series = sortSeriesByLabel(Array.from(merged.values()));
    const totals = series.reduce((acc, r) => {
      acc.totalOrderRevenue += r.orderAmount;
      acc.totalPaymentRevenue += r.paymentAmount;
      acc.totalOrders += r.orderCount;
      acc.totalPayments += r.paymentCount;
      return acc;
    }, { totalOrderRevenue: 0, totalPaymentRevenue: 0, totalOrders: 0, totalPayments: 0 });

    res.status(200).json({ success: true, data: { groupBy, from: start, to: end, series, totals } });
  } catch (error) {
    next(error);
  }
};

const getStockStats = async (req, res, next) => {
  try {
    const { start, end } = getDateRange({ from: req.query.from, to: req.query.to });
    const groupBy = req.query.groupBy || "day";
    const projection = buildDateProjection(groupBy);

    const grouped = await StockTransaction.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { ...projection, type: "$type" }, quantity: { $sum: "$quantity" }, amount: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: buildDateSort(groupBy) }
    ]);

    const series = grouped.map(d => ({ label: formatBucketLabel(d._id), type: d._id.type, quantity: d.quantity, amount: d.amount, count: d.count }));

    const topIngredients = await StockTransaction.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { ingredient: "$ingredient", type: "$type" }, amount: { $sum: "$totalAmount" }, quantity: { $sum: "$quantity" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
      { $limit: 10 },
      { $lookup: { from: "ingredients", localField: "_id.ingredient", foreignField: "_id", as: "ingredient" } },
      { $unwind: { path: "$ingredient", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, ingredientId: "$_id.ingredient", type: "$_id.type", ingredientName: "$ingredient.name", amount: 1, quantity: 1, count: 1 } }
    ]);

    res.status(200).json({ success: true, data: { groupBy, from: start, to: end, series, topIngredients } });
  } catch (error) {
    next(error);
  }
};

const getStockTransactions = async (req, res, next) => {
  try {
    const { start, end } = getDateRange({ from: req.query.from, to: req.query.to });
    const type = req.query.type && ["IN", "OUT"].includes(req.query.type) ? req.query.type : undefined;
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const skip = (page - 1) * limit;

    const match = { createdAt: { $gte: start, $lte: end } };
    if (type) match.type = type;

    const [items, total] = await Promise.all([
      StockTransaction.find(match)
        .populate("ingredient", "name unit")
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransaction.countDocuments(match)
    ]);

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (error) {
    next(error);
  }
};

const getTableBookingStats = async (req, res, next) => {
  try {
    const { start, end } = getDateRange({ from: req.query.from, to: req.query.to });
    const groupBy = req.query.groupBy || "day";
    const projection = buildDateProjection(groupBy);

    const Table = require("../models/tableModel");

    // Aggregate orders by table and date for booking stats
    const bookingStats = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          $or: [
            { table: { $exists: true, $ne: null } },
            { tableNumber: { $exists: true, $ne: null } }
          ]
        } 
      },
      {
        $lookup: {
          from: "tables",
          localField: "table",
          foreignField: "_id",
          as: "tableInfo"
        }
      },
      {
        $addFields: {
          resolvedTableNumber: {
            $cond: {
              if: { $gt: [{ $size: "$tableInfo" }, 0] },
              then: { $arrayElemAt: ["$tableInfo.tableNo", 0] },
              else: "$tableNumber"
            }
          }
        }
      },
      { 
        $group: { 
          _id: projection,
          totalOrders: { $sum: 1 },
          uniqueTables: { $addToSet: "$resolvedTableNumber" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Completed"] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] }
          }
        } 
      },
      { 
        $project: {
          _id: 1,
          totalOrders: 1,
          tableCount: { $size: "$uniqueTables" },
          completedOrders: 1,
          pendingOrders: 1
        }
      },
      { $sort: buildDateSort(groupBy) }
    ]);

    const series = sortSeriesByLabel(bookingStats.map(d => ({
      label: formatBucketLabel(d._id),
      totalOrders: d.totalOrders,
      tableCount: d.tableCount,
      completedOrders: d.completedOrders,
      pendingOrders: d.pendingOrders
    })));

    // Get current table status
    const tables = await Table.find({});
    const tableStatus = {
      available: tables.filter(t => t.status === "Available").length,
      occupied: tables.filter(t => t.status === "Occupied").length,
      booked: tables.filter(t => t.status === "Booked").length,
      total: tables.length
    };

    // Get most popular tables
    const popularTables = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          $or: [
            { table: { $exists: true, $ne: null } },
            { tableNumber: { $exists: true, $ne: null } }
          ]
        } 
      },
      {
        $lookup: {
          from: "tables",
          localField: "table",
          foreignField: "_id",
          as: "tableInfo"
        }
      },
      {
        $addFields: {
          resolvedTableNumber: {
            $cond: {
              if: { $gt: [{ $size: "$tableInfo" }, 0] },
              then: { $arrayElemAt: ["$tableInfo.tableNo", 0] },
              else: "$tableNumber"
            }
          }
        }
      },
      { 
        $group: { 
          _id: "$resolvedTableNumber",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } }
        } 
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          tableNumber: "$_id",
          orderCount: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        groupBy, 
        from: start, 
        to: end, 
        series,
        tableStatus,
        popularTables
      } 
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerStats = async (req, res, next) => {
  try {
    const { start, end } = getDateRange({ from: req.query.from, to: req.query.to });
    const groupBy = req.query.groupBy || "day";
    const projection = buildDateProjection(groupBy);

    // Customer stats by date
    const customerStats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { 
        $group: { 
          _id: projection,
          totalGuests: { $sum: { $ifNull: ["$customerDetails.guests", 1] } },
          totalOrders: { $sum: 1 },
          uniquePhones: { $addToSet: "$customerDetails.phone" },
          avgGuestsPerOrder: { $avg: { $ifNull: ["$customerDetails.guests", 1] } }
        } 
      },
      {
        $project: {
          _id: 1,
          totalGuests: 1,
          totalOrders: 1,
          uniqueCustomers: { $size: "$uniquePhones" },
          avgGuestsPerOrder: { $round: ["$avgGuestsPerOrder", 2] }
        }
      },
      { $sort: buildDateSort(groupBy) }
    ]);

    const series = sortSeriesByLabel(customerStats.map(d => ({
      label: formatBucketLabel(d._id),
      totalGuests: d.totalGuests,
      totalOrders: d.totalOrders,
      uniqueCustomers: d.uniqueCustomers,
      avgGuestsPerOrder: d.avgGuestsPerOrder
    })));

    // Top customers by order count
    const topCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { 
        $group: { 
          _id: {
            name: "$customerDetails.name",
            phone: "$customerDetails.phone"
          },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ["$totalAmount", 0] } },
          totalGuests: { $sum: { $ifNull: ["$customerDetails.guests", 1] } }
        } 
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          phone: "$_id.phone",
          orderCount: 1,
          totalSpent: 1,
          totalGuests: 1,
          avgSpent: { $round: [{ $divide: ["$totalSpent", "$orderCount"] }, 2] }
        }
      }
    ]);

    // Overall totals
    const totals = series.reduce((acc, row) => {
      acc.totalGuests += row.totalGuests;
      acc.totalOrders += row.totalOrders;
      acc.uniqueCustomers += row.uniqueCustomers;
      return acc;
    }, { totalGuests: 0, totalOrders: 0, uniqueCustomers: 0 });

    res.status(200).json({ 
      success: true, 
      data: { 
        groupBy, 
        from: start, 
        to: end, 
        series,
        topCustomers,
        totals
      } 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevenue, getStockStats, getStockTransactions, getTableBookingStats, getCustomerStats };


