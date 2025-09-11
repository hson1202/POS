const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
    tableNo: { type: Number, required: true, unique: true },
    status: {
        type: String,
        default: "Available"
    },
    seats: { 
        type: Number,
        default: 4  // Default 4 seats, không còn required
    },
    currentOrder: {type: mongoose.Schema.Types.ObjectId, ref: "Order"}
});

module.exports = mongoose.model("Table", tableSchema);