const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const { isVerifiedUser } = require('../middlewares/tokenVerification');
const { requireAdmin } = require('../middlewares/adminAuth');

// Tất cả routes đều cần xác thực token và quyền admin
// router.use(isVerifiedUser);
// router.use(requireAdmin);

// Routes cho quản lý món ăn
router.get('/', menuItemController.getAllMenuItems);
router.get('/category/:category', menuItemController.getMenuItemsByCategory);
router.get('/unavailable', menuItemController.getUnavailableMenuItems);
router.get('/:menuItemId/availability', menuItemController.checkMenuItemAvailability);
router.get('/:menuItemId/price/:quantity?', menuItemController.calculateMenuItemPrice);

// CRUD operations
router.post('/', menuItemController.createMenuItem);
router.put('/:id', menuItemController.updateMenuItem);
router.delete('/:id', menuItemController.deleteMenuItem);

// Quản lý kho khi chế biến
router.post('/consume-ingredients', menuItemController.consumeIngredientsForMenuItem);

// Triển khai menu
router.post('/deploy/add', menuItemController.deployMenuItems);
router.post('/deploy/replace', menuItemController.replaceMenuItems);

module.exports = router; 