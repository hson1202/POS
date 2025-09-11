const MenuItem = require('../models/menuItemModel');
const Ingredient = require('../models/ingredientModel');
const StockTransaction = require('../models/stockTransactionModel');

// Lấy tất cả món ăn
const getAllMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ isAvailable: true })
            .populate('recipe.ingredient', 'name category unit currentStock')
            .sort({ category: 1, name: 1 });
        
        res.status(200).json({
            success: true,
            data: menuItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách món ăn',
            error: error.message
        });
    }
};

// Lấy món ăn theo category
const getMenuItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const menuItems = await MenuItem.find({ 
            category, 
            isAvailable: true 
        })
        .populate('recipe.ingredient', 'name category unit currentStock')
        .sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            data: menuItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy món ăn theo danh mục',
            error: error.message
        });
    }
};

// Tạo món ăn mới
const createMenuItem = async (req, res) => {
    try {
        console.log('Request body size:', JSON.stringify(req.body).length, 'characters');
        
        // Kiểm tra kích thước request body
        const requestSize = JSON.stringify(req.body).length;
        if (requestSize > 10 * 1024 * 1024) { // 10MB limit
            return res.status(413).json({
                success: false,
                message: 'Dữ liệu quá lớn. Vui lòng giảm kích thước hình ảnh.'
            });
        }
        
        const menuItem = new MenuItem(req.body);
        console.log('MenuItem object:', menuItem);
        await menuItem.save();
        
        // Populate recipe để trả về thông tin đầy đủ
        await menuItem.populate('recipe.ingredient', 'name category unit currentStock');
        
        res.status(201).json({
            success: true,
            message: 'Tạo món ăn thành công',
            data: menuItem
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo món ăn',
            error: error.message
        });
    }
};

// Cập nhật món ăn
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await MenuItem.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('recipe.ingredient', 'name category unit currentStock');
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật món ăn thành công',
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật món ăn',
            error: error.message
        });
    }
};

// Xóa món ăn (soft delete)
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await MenuItem.findByIdAndUpdate(
            id, 
            { isAvailable: false }, 
            { new: true }
        );
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Xóa món ăn thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa món ăn',
            error: error.message
        });
    }
};

// Kiểm tra khả năng chế biến món ăn
const checkMenuItemAvailability = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const menuItem = await MenuItem.findById(menuItemId)
            .populate('recipe.ingredient', 'name currentStock minStock unit');
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }
        
        const availability = {
            canPrepare: true,
            missingIngredients: [],
            lowStockIngredients: []
        };
        
        for (const recipeItem of menuItem.recipe) {
            const ingredient = recipeItem.ingredient;
            if (ingredient.currentStock < recipeItem.quantity) {
                availability.canPrepare = false;
                availability.missingIngredients.push({
                    name: ingredient.name,
                    required: recipeItem.quantity,
                    available: ingredient.currentStock,
                    unit: ingredient.unit
                });
            } else if (ingredient.currentStock <= ingredient.minStock) {
                availability.lowStockIngredients.push({
                    name: ingredient.name,
                    current: ingredient.currentStock,
                    min: ingredient.minStock,
                    unit: ingredient.unit
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: availability
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra khả năng chế biến',
            error: error.message
        });
    }
};

// Xuất kho khi chế biến món ăn
const consumeIngredientsForMenuItem = async (req, res) => {
    try {
        const { menuItemId, quantity = 1, orderId } = req.body;
        
        const menuItem = await MenuItem.findById(menuItemId)
            .populate('recipe.ingredient');
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }
        
        const transactions = [];
        const updatedIngredients = [];
        
        // Kiểm tra và trừ kho từng nguyên liệu
        for (const recipeItem of menuItem.recipe) {
            const ingredient = recipeItem.ingredient;
            const requiredQuantity = recipeItem.quantity * quantity;
            
            if (ingredient.currentStock < requiredQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Không đủ nguyên liệu: ${ingredient.name}`
                });
            }
            
            const previousStock = ingredient.currentStock;
            const newStock = previousStock - requiredQuantity;
            
            // Cập nhật stock
            ingredient.currentStock = newStock;
            await ingredient.save();
            updatedIngredients.push(ingredient);
            
            // Tạo transaction record
            const transaction = new StockTransaction({
                ingredient: ingredient._id,
                type: 'OUT',
                quantity: requiredQuantity,
                unitPrice: ingredient.pricePerUnit,
                totalAmount: requiredQuantity * ingredient.pricePerUnit,
                reason: 'SALE',
                reference: orderId || `Menu Item: ${menuItem.name}`,
                notes: `Chế biến món: ${menuItem.name}`,
                performedBy: req.user.id,
                previousStock,
                newStock
            });
            await transaction.save();
            transactions.push(transaction);
        }
        
        res.status(200).json({
            success: true,
            message: 'Xuất kho thành công',
            data: {
                menuItem: menuItem.name,
                quantity,
                transactions,
                updatedIngredients
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất kho nguyên liệu',
            error: error.message
        });
    }
};

// Tính giá món ăn với thuế
const calculateMenuItemPrice = async (req, res) => {
    try {
        const { menuItemId, quantity = 1 } = req.params;
        
        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }
        
        const subtotal = menuItem.price * quantity;
        const taxAmount = (menuItem.price * menuItem.taxRate / 100) * quantity;
        const total = subtotal + taxAmount;
        
        res.status(200).json({
            success: true,
            data: {
                menuItem: menuItem.name,
                quantity,
                price: menuItem.price,
                taxRate: menuItem.taxRate,
                subtotal,
                taxAmount,
                total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tính giá món ăn',
            error: error.message
        });
    }
};

// Lấy món ăn sắp hết nguyên liệu
const getUnavailableMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ isAvailable: true })
            .populate('recipe.ingredient', 'name currentStock minStock unit');
        
        const unavailableItems = [];
        
        for (const menuItem of menuItems) {
            let canPrepare = true;
            const missingIngredients = [];
            
            for (const recipeItem of menuItem.recipe) {
                const ingredient = recipeItem.ingredient;
                if (ingredient.currentStock < recipeItem.quantity) {
                    canPrepare = false;
                    missingIngredients.push({
                        name: ingredient.name,
                        required: recipeItem.quantity,
                        available: ingredient.currentStock,
                        unit: ingredient.unit
                    });
                }
            }
            
            if (!canPrepare) {
                unavailableItems.push({
                    menuItem,
                    missingIngredients
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: unavailableItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra món ăn không khả dụng',
            error: error.message
        });
    }
};

// Triển khai menu - thêm món ăn vào menu hiện tại
const deployMenuItems = async (req, res) => {
    try {
        const { menuItems } = req.body;
        
        if (!menuItems || !Array.isArray(menuItems)) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu menu items không hợp lệ'
            });
        }

        // Cập nhật trạng thái isAvailable = true cho các món ăn được chọn
        const itemIds = menuItems.map(item => item._id);
        await MenuItem.updateMany(
            { _id: { $in: itemIds } },
            { isAvailable: true }
        );

        res.status(200).json({
            success: true,
            message: 'Triển khai menu thành công',
            data: {
                deployedCount: menuItems.length
            }
        });
    } catch (error) {
        console.error('Error deploying menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi triển khai menu',
            error: error.message
        });
    }
};

// Triển khai menu - thay thế toàn bộ menu
const replaceMenuItems = async (req, res) => {
    try {
        const { menuItems } = req.body;
        
        if (!menuItems || !Array.isArray(menuItems)) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu menu items không hợp lệ'
            });
        }

        // Đặt tất cả món ăn về trạng thái không khả dụng
        await MenuItem.updateMany({}, { isAvailable: false });

        // Cập nhật trạng thái isAvailable = true cho các món ăn được chọn
        const itemIds = menuItems.map(item => item._id);
        await MenuItem.updateMany(
            { _id: { $in: itemIds } },
            { isAvailable: true }
        );

        res.status(200).json({
            success: true,
            message: 'Thay thế menu thành công',
            data: {
                deployedCount: menuItems.length,
                totalMenuItems: await MenuItem.countDocuments()
            }
        });
    } catch (error) {
        console.error('Error replacing menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay thế menu',
            error: error.message
        });
    }
};

module.exports = {
    getAllMenuItems,
    getMenuItemsByCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    checkMenuItemAvailability,
    consumeIngredientsForMenuItem,
    calculateMenuItemPrice,
    getUnavailableMenuItems,
    deployMenuItems,
    replaceMenuItems
}; 