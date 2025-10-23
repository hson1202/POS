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

        // Normalize status to our enum
        const normalizedStatus = (() => {
          const s = (payment.status || '').toLowerCase();
          if (s === 'captured' || s === 'paid' || s === 'success') return 'completed';
          if (s === 'authorized') return 'pending';
          if (s === 'failed' || s === 'cancelled' || s === 'canceled') return 'failed';
          return 'pending';
        })();

        // Try to link to our internal order via stored Razorpay order id
        let linkedOrder = null;
        try {
          linkedOrder = await Order.findOne({ 'paymentData.razorpay_order_id': payment.order_id });
        } catch (findErr) {
          console.warn('Failed to search order by razorpay_order_id:', findErr?.message);
        }

        if (!linkedOrder) {
          console.warn('No internal order found for Razorpay order id:', payment.order_id);
        }

        // Add Payment Details in Database
        const newPayment = new Payment({
          paymentId: payment.id,
          orderId: linkedOrder?._id, // must be a valid ObjectId per schema
          amount: payment.amount / 100,
          currency: payment.currency,
          status: normalizedStatus,
          paymentMethod: 'razorpay',
          email: payment.email,
          contact: payment.contact,
          transactionId: payment.id,
          notes: 'Payment via Razorpay webhook',
          createdAt: new Date(payment.created_at * 1000)
        });

        // Only save if order is linked (orderId is required by schema)
        if (newPayment.orderId) {
          await newPayment.save();
        } else {
          console.warn('Skipped saving payment because order link was not found');
        }
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
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderId',
        select: 'tableNumber table customerDetails totalAmount',
      })
      .lean();

    const enriched = payments.map((p) => {
      const order = p.orderId && typeof p.orderId === 'object' ? p.orderId : null;
      const tableNumber = order?.tableNumber || order?.table?.tableNo || null;
      const customerName = order?.customerDetails?.name || undefined;
      const customerPhone = order?.customerDetails?.phone || undefined;
      const totalAmount = order?.totalAmount || undefined;
      return {
        ...p,
        orderInfo: {
          tableNumber,
          customerName,
          customerPhone,
          totalAmount,
          orderId: order?._id || p.orderId || null,
        },
      };
    });

    res.status(200).json({ success: true, data: enriched });
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
