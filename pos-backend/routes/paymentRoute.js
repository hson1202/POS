const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { 
  createOrder, 
  verifyPayment, 
  webHookVerification, 
  getPayments, 
  getPaymentById, 
  createManualPayment, 
  getPaymentStats 
} = require("../controllers/paymentController");
 
// Razorpay integration routes
router.route("/create-order").post(isVerifiedUser, createOrder);
router.route("/verify-payment").post(isVerifiedUser, verifyPayment);
router.route("/webhook-verification").post(webHookVerification);

// Payment management routes
router.route("/").get(isVerifiedUser, getPayments); // Get all payments
router.route("/stats").get(isVerifiedUser, getPaymentStats); // Get payment statistics
router.route("/manual").post(isVerifiedUser, createManualPayment); // Create manual payment
router.route("/:id").get(isVerifiedUser, getPaymentById); // Get payment by ID

module.exports = router;