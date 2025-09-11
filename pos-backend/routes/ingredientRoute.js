const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { isVerifiedUser } = require('../middlewares/tokenVerification');
const { requireAdmin } = require('../middlewares/adminAuth');

// Tất cả routes đều cần xác thực token và quyền admin
router.use(isVerifiedUser);
router.use(requireAdmin);

// Routes cho quản lý nguyên liệu
router.get('/', ingredientController.getAllIngredients);
router.get('/category/:category', ingredientController.getIngredientsByCategory);
router.get('/low-stock', ingredientController.getLowStockIngredients);
router.get('/history', ingredientController.getStockHistory);

// CRUD operations
router.post('/', ingredientController.createIngredient);
router.put('/:id', ingredientController.updateIngredient);
router.delete('/:id', ingredientController.deleteIngredient);

// Quản lý kho
router.post('/stock/add', ingredientController.addStock);
router.post('/stock/reduce', ingredientController.reduceStock);

module.exports = router; 