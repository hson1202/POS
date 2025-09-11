const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true},
        guests: { type: Number, required: true },
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Pending",
        enum: ["Pending", "In Progress", "Ready", "Completed"]
    },
    orderDate: {
        type: Date,
        default : Date.now()
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    items: [],
    table: { type: String, required: true }, // Đổi thành String để accept tableId từ URL
    notes: String,
    bookingTime: Date,
    paymentMethod: String,
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    }
}, { timestamps : true } );

module.exports = mongoose.model("Order", orderSchema);