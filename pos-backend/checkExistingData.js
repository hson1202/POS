const mongoose = require('mongoose');
const config = require('./config/config');
const User = require('./models/userModel');
const Ingredient = require('./models/ingredientModel');
const MenuItem = require('./models/menuItemModel');

console.log('🔍 Kiểm tra dữ liệu hiện có trong database...');

mongoose.connect(config.databaseURI)
    .then(async () => {
        console.log('✅ Kết nối thành công!');
        
        try {
            // Kiểm tra users
            const users = await User.find({});
            console.log(`\n👥 Users: ${users.length}`);
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
            });
            
            // Kiểm tra ingredients
            const ingredients = await Ingredient.find({});
            console.log(`\n🥕 Ingredients: ${ingredients.length}`);
            ingredients.forEach((ingredient, index) => {
                console.log(`   ${index + 1}. ${ingredient.name} - Stock: ${ingredient.currentStock}${ingredient.unit} (Min: ${ingredient.minStock}${ingredient.unit})`);
            });
            
            // Kiểm tra menu items
            const menuItems = await MenuItem.find({});
            console.log(`\n🍽️  Menu Items: ${menuItems.length}`);
            menuItems.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - ${item.category} - ${item.price.toLocaleString('vi-VN')}đ`);
            });
            
            console.log('\n📊 Tóm tắt:');
            console.log(`   - Users: ${users.length}`);
            console.log(`   - Ingredients: ${ingredients.length}`);
            console.log(`   - Menu Items: ${menuItems.length}`);
            
            if (ingredients.length === 0) {
                console.log('\n💡 Chưa có ingredients nào. Bạn có muốn chạy seedData.js để tạo dữ liệu mẫu không?');
            }
            
            if (menuItems.length === 0) {
                console.log('\n💡 Chưa có menu items nào. Bạn có thể thêm món ăn mới qua trang "Quản lý menu".');
            }
            
        } catch (error) {
            console.log('❌ Lỗi:', error.message);
        }
        
        process.exit(0);
    })
    .catch((error) => {
        console.log('❌ Lỗi kết nối:', error.message);
        process.exit(1);
    }); 