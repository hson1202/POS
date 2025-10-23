const express = require("express");
const { 
  addOrder, 
  getOrders, 
  getOrderById, 
  updateOrder, 
  fixOrdersStatus, 
  getDashboardStats,
  getPopularDishes
} = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { requireManager } = require("../middlewares/managerAuth");
const { requireEmployee } = require("../middlewares/employeeAuth");
const router = express.Router();

router.route("/").post(addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/stats").get(isVerifiedUser, getDashboardStats); // API cho dashboard statistics
router.route("/popular").get(isVerifiedUser, getPopularDishes); // API cho popular dishes
router.route("/fix-status").post(isVerifiedUser, fixOrdersStatus); // API để fix orders status
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, requireEmployee, updateOrder); // Cho phép nhân viên (employee, waiter, cashier, manager, admin) cập nhật trạng thái đơn hàng

module.exports = router;