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
        enum: ['Meat', 'Vegetables', 'Spices', 'Grains', 'Seafood', 'Dairy & Eggs', 'Others']
    },
    unit: { 
        type: String, 
        required: true,
        enum: ['g', 'kg', 'ml', 'l', 'piece', 'bunch', 'pack', 'box']
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
        required: true,
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