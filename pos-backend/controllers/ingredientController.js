const Ingredient = require('../models/ingredientModel');
const StockTransaction = require('../models/stockTransactionModel');

// Lấy tất cả nguyên liệu
const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({ isActive: true })
            .sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            data: ingredients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nguyên liệu',
            error: error.message
        });
    }
};

// Lấy nguyên liệu theo category
const getIngredientsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const ingredients = await Ingredient.find({ 
            category, 
            isActive: true 
        }).sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            data: ingredients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy nguyên liệu theo danh mục',
            error: error.message
        });
    }
};

// Tạo nguyên liệu mới
const createIngredient = async (req, res) => {
    try {
        const ingredient = new Ingredient(req.body);
        await ingredient.save();
        
        res.status(201).json({
            success: true,
            message: 'Tạo nguyên liệu thành công',
            data: ingredient
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Tên nguyên liệu đã tồn tại'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo nguyên liệu',
            error: error.message
        });
    }
};

// Cập nhật nguyên liệu
const updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = await Ingredient.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật nguyên liệu thành công',
            data: ingredient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nguyên liệu',
            error: error.message
        });
    }
};

// Xóa nguyên liệu (soft delete)
const deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = await Ingredient.findByIdAndUpdate(
            id, 
            { isActive: false }, 
            { new: true }
        );
        
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Xóa nguyên liệu thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa nguyên liệu',
            error: error.message
        });
    }
};

// Nhập kho nguyên liệu
const addStock = async (req, res) => {
    try {
        const { ingredientId, quantity, unitPrice, supplier, notes } = req.body;
        
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu'
            });
        }
        
        const previousStock = ingredient.currentStock;
        const newStock = previousStock + quantity;
        const totalAmount = quantity * unitPrice;
        
        // Cập nhật stock
        ingredient.currentStock = newStock;
        if (supplier) ingredient.supplier = supplier;
        await ingredient.save();
        
        // Tạo transaction record
        const transaction = new StockTransaction({
            ingredient: ingredientId,
            type: 'IN',
            quantity,
            unitPrice,
            totalAmount,
            reason: 'PURCHASE',
            notes: notes || `Nhập kho từ ${supplier || 'nhà cung cấp'}`,
            performedBy: req.user.id,
            previousStock,
            newStock
        });
        await transaction.save();
        
        res.status(200).json({
            success: true,
            message: 'Nhập kho thành công',
            data: {
                ingredient,
                transaction
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi nhập kho',
            error: error.message
        });
    }
};

// Xuất kho nguyên liệu
const reduceStock = async (req, res) => {
    try {
        const { ingredientId, quantity, reason, notes } = req.body;
        
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu'
            });
        }
        
        if (ingredient.currentStock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng trong kho không đủ'
            });
        }
        
        const previousStock = ingredient.currentStock;
        const newStock = previousStock - quantity;
        
        // Cập nhật stock
        ingredient.currentStock = newStock;
        await ingredient.save();
        
        // Tạo transaction record
        const transaction = new StockTransaction({
            ingredient: ingredientId,
            type: 'OUT',
            quantity,
            unitPrice: ingredient.pricePerUnit,
            totalAmount: quantity * ingredient.pricePerUnit,
            reason: reason || 'SALE',
            notes: notes || 'Xuất kho',
            performedBy: req.user.id,
            previousStock,
            newStock
        });
        await transaction.save();
        
        res.status(200).json({
            success: true,
            message: 'Xuất kho thành công',
            data: {
                ingredient,
                transaction
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất kho',
            error: error.message
        });
    }
};

// Lấy lịch sử giao dịch kho
const getStockHistory = async (req, res) => {
    try {
        const { ingredientId, startDate, endDate, type } = req.query;
        
        let filter = {};
        if (ingredientId) filter.ingredient = ingredientId;
        if (type) filter.type = type;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        
        const transactions = await StockTransaction.find(filter)
            .populate('ingredient', 'name category unit')
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(100);
        
        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử kho',
            error: error.message
        });
    }
};

// Kiểm tra nguyên liệu sắp hết
const getLowStockIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({
            isActive: true,
            $expr: { $lte: ['$currentStock', '$minStock'] }
        }).sort({ currentStock: 1 });
        
        res.status(200).json({
            success: true,
            data: ingredients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra nguyên liệu sắp hết',
            error: error.message
        });
    }
};

module.exports = {
    getAllIngredients,
    getIngredientsByCategory,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    addStock,
    reduceStock,
    getStockHistory,
    getLowStockIngredients
}; 