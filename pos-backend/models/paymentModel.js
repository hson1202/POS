const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    // Razorpay fields
    paymentId: String, // Razorpay payment ID
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    
    // Payment details
    amount: { 
        type: Number, 
        required: true,
        min: 0
    },
    currency: { 
        type: String, 
        default: 'HUF' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'bank_transfer', 'qr_code', 'razorpay'],
        default: 'cash'
    },
    
    // Transaction details
    transactionId: String, // Custom transaction ID for manual payments
    
    // Customer details
    email: String,
    contact: String,
    
    // Additional info
    notes: String,
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for better query performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;