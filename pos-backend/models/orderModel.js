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
        enum: ["Pending", "In Progress", "Ready", "Completed", "Booked"]
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
    totalAmount: { type: Number }, // Total amount for easy access (can be same as bills.totalWithTax)
    items: [],
    table: { type: String }, // Optional - not all orders have table (guest orders, takeaway)
    tableNumber: { type: String }, // Table number for display
    notes: String,
    bookingTime: Date, // Thời gian tạo booking
    reservationDateTime: Date, // Ngày giờ dự kiến khách đến
    paymentMethod: String,
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    }
}, { timestamps : true } );

module.exports = mongoose.model("Order", orderSchema);