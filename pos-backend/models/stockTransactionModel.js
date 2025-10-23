const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['IN', 'OUT'], // IN: nhập kho, OUT: xuất kho
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unitPrice: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    reason: {
        type: String,
        required: true,
        enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'TRANSFER']
    },
    reference: {
        type: String, // Tham chiếu đến đơn hàng hoặc hóa đơn nhập
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    previousStock: {
        type: Number,
        required: true
    },
    newStock: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Index để tìm kiếm nhanh
stockTransactionSchema.index({ ingredient: 1, type: 1, createdAt: -1 });
stockTransactionSchema.index({ reason: 1, createdAt: -1 });

module.exports = mongoose.model("StockTransaction", stockTransactionSchema); 