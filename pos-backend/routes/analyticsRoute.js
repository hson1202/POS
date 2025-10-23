const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { getRevenue, getStockStats, getStockTransactions, getTableBookingStats, getCustomerStats } = require("../controllers/analyticsController");

router.get("/revenue", isVerifiedUser, getRevenue);
router.get("/stock", isVerifiedUser, getStockStats);
router.get("/stock/transactions", isVerifiedUser, getStockTransactions);
router.get("/tables", isVerifiedUser, getTableBookingStats);
router.get("/customers", isVerifiedUser, getCustomerStats);

module.exports = router;


