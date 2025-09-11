const Razorpay = require("razorpay");
const config = require("../config/config");
const crypto = require("crypto");
const createHttpError = require("http-errors");
const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");

const createOrder = async (req, res, next) => {
  const razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpaySecretKey,
  });

  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Amount in fillér (1 HUF = 100 fillér)
      currency: "HUF",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully!" });
    } else {
      const error = createHttpError(400, "Payment verification failed!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

const webHookVerification = async (req, res, next) => {
  try {
    const secret = config.razorpyWebhookSecret;
    const signature = req.headers["x-razorpay-signature"];

    const body = JSON.stringify(req.body);

    // 🛑 Verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === signature) {
      console.log("✅ Webhook verified:", req.body);

      // ✅ Process payment (e.g., update DB, send confirmation email)
      if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        console.log(`💰 Payment Captured: ${payment.amount / 100} HUF`);

        // Add Payment Details in Database
        const newPayment = new Payment({
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: 'razorpay', // Set method for Razorpay payments
          email: payment.email,
          contact: payment.contact,
          transactionId: payment.id,
          notes: 'Payment via Razorpay webhook',
          createdAt: new Date(payment.created_at * 1000) 
        })

        await newPayment.save();
      }

      res.json({ success: true });
    } else {
      const error = createHttpError(400, "❌ Invalid Signature!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

// Get all payments
const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Use lean for better performance
    
    res.status(200).json({ 
      success: true, 
      data: payments 
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    next(error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      const error = createHttpError(404, "Payment not found!");
      return next(error);
    }
    
    res.status(200).json({ 
      success: true, 
      data: payment 
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    next(error);
  }
};

// Create a manual payment (for cash, card, etc.)
const createManualPayment = async (req, res, next) => {
  try {
    const { 
      orderId, 
      amount, 
      paymentMethod = 'cash', 
      status = 'completed',
      transactionId,
      notes 
    } = req.body;
    
    // Validate required fields
    if (!orderId || !amount) {
      const error = createHttpError(400, "OrderId and amount are required!");
      return next(error);
    }
    
    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }
    
    // Create payment record
    const payment = new Payment({
      orderId,
      amount,
      paymentMethod,
      status,
      transactionId: transactionId || `TXN_${Date.now()}`,
      notes,
      createdAt: new Date()
    });
    
    await payment.save();
    
    res.status(201).json({
      success: true,
      message: "Payment created successfully!",
      data: payment
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    next(error);
  }
};

// Get payment statistics
const getPaymentStats = async (req, res, next) => {
  try {
    const payments = await Payment.find();
    
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      completedPayments: payments.filter(p => p.status?.toLowerCase() === 'completed').length,
      completedAmount: payments
        .filter(p => p.status?.toLowerCase() === 'completed')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0),
      pendingPayments: payments.filter(p => p.status?.toLowerCase() === 'pending').length,
      failedPayments: payments.filter(p => p.status?.toLowerCase() === 'failed').length,
      paymentMethods: {
        cash: payments.filter(p => p.paymentMethod?.toLowerCase() === 'cash').length,
        card: payments.filter(p => p.paymentMethod?.toLowerCase() === 'card').length,
        bank_transfer: payments.filter(p => p.paymentMethod?.toLowerCase() === 'bank_transfer').length,
        qr_code: payments.filter(p => p.paymentMethod?.toLowerCase() === 'qr_code').length
      }
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    next(error);
  }
};

module.exports = { 
  createOrder, 
  verifyPayment, 
  webHookVerification, 
  getPayments, 
  getPaymentById, 
  createManualPayment, 
  getPaymentStats 
};
