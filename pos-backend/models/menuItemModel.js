const mongoose = require("mongoose");

const recipeItemSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    }
});

const menuItemSchema = new mongoose.Schema({
    itemCode: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    category: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        default: ''
    },
    price: { 
        type: Number, 
        required: true,
        min: 0
    },
    taxRate: { 
        type: Number, 
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    discount: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 100
    },

    image: { 
        type: String,
        default: ''
    },
    recipe: [recipeItemSchema], // List of required ingredients
    preparationTime: { 
        type: Number, // Preparation time (minutes)
        default: 15
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    isVegetarian: { 
        type: Boolean, 
        default: false 
    },
    isSpicy: { 
        type: Boolean, 
        default: false 
    },
    allergens: [{ 
        type: String 
    }], // List of allergens
    nutritionalInfo: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field to calculate priceWithTax when needed
menuItemSchema.virtual('priceWithTax').get(function() {
    if (this.price && this.taxRate !== undefined) {
        let finalPrice = this.price * (1 + this.taxRate / 100);
        
        // Apply discount if any
        if (this.discount && this.discount > 0) {
            finalPrice = finalPrice * (1 - this.discount / 100);
        }
        
        return Math.round(finalPrice);
    }
    return this.price || 0;
});

// Index for fast searching
menuItemSchema.index({ name: 1, category: 1, isAvailable: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema); 