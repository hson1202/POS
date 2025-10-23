const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    category: { 
        type: String, 
        required: true,
        trim: true
    },
    unit: { 
        type: String, 
        required: true,
        trim: true
    },
    currentStock: { 
        type: Number, 
        required: true,
        default: 0,
        min: 0
    },
    minStock: { 
        type: Number, 
        required: true,
        default: 0,
        min: 0
    },
    pricePerUnit: { 
        type: Number, 
        required: false,
        default: 0,
        min: 0
    },
    supplier: { 
        type: String,
        default: ''
    },
    description: { 
        type: String,
        default: ''
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Index for fast searching
ingredientSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model("Ingredient", ingredientSchema); 