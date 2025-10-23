const mongoose = require('mongoose');
const Ingredient = require('./models/ingredientModel');
const MenuItem = require('./models/menuItemModel');
const Table = require('./models/tableModel');
const config = require('./config/config');

// Kết nối database
mongoose.connect(config.databaseURI);

// Dữ liệu mẫu cho nguyên liệu
const sampleIngredients = [
    {
        name: 'Thịt bò',
        category: 'Thịt',
        unit: 'g',
        currentStock: 5000,
        minStock: 1000,
        // pricePerUnit removed (not used for accounting here)
        supplier: 'Nhà cung cấp thịt ABC',
        description: 'Thịt bò tươi ngon'
    },
    {
        name: 'Mì sợi',
        category: 'Ngũ cốc',
        unit: 'g',
        currentStock: 10000,
        minStock: 2000,
        supplier: 'Nhà cung cấp mì XYZ',
        description: 'Mì sợi tươi'
    },
    {
        name: 'Hành lá',
        category: 'Rau củ',
        unit: 'g',
        currentStock: 2000,
        minStock: 500,
        supplier: 'Chợ rau quả',
        description: 'Hành lá tươi'
    },
    {
        name: 'Tỏi',
        category: 'Gia vị',
        unit: 'g',
        currentStock: 1500,
        minStock: 300,
        supplier: 'Chợ gia vị',
        description: 'Tỏi tươi'
    },
    {
        name: 'Dầu ăn',
        category: 'Gia vị',
        unit: 'ml',
        currentStock: 5000,
        minStock: 1000,
        supplier: 'Nhà cung cấp dầu ăn',
        description: 'Dầu ăn tinh luyện'
    },
    {
        name: 'Nước mắm',
        category: 'Gia vị',
        unit: 'ml',
        currentStock: 3000,
        minStock: 500,
        supplier: 'Nhà cung cấp nước mắm',
        description: 'Nước mắm truyền thống'
    },
    {
        name: 'Gà',
        category: 'Thịt',
        unit: 'g',
        currentStock: 8000,
        minStock: 2000,
        supplier: 'Trang trại gà',
        description: 'Thịt gà tươi'
    },
    {
        name: 'Cà chua',
        category: 'Rau củ',
        unit: 'g',
        currentStock: 3000,
        minStock: 800,
        supplier: 'Chợ rau quả',
        description: 'Cà chua tươi'
    },
    {
        name: 'Trứng',
        category: 'Trứng sữa',
        unit: 'cái',
        currentStock: 200,
        minStock: 50,
        supplier: 'Trang trại trứng',
        description: 'Trứng gà tươi'
    },
    {
        name: 'Sữa tươi',
        category: 'Trứng sữa',
        unit: 'ml',
        currentStock: 10000,
        minStock: 2000,
        supplier: 'Nhà cung cấp sữa',
        description: 'Sữa tươi nguyên chất'
    }
];

// Dữ liệu mẫu cho bàn ăn
const sampleTables = [
    { tableNo: 1, seats: 2, status: "Available" },
    { tableNo: 2, seats: 4, status: "Available" },
    { tableNo: 3, seats: 6, status: "Available" },
    { tableNo: 4, seats: 2, status: "Available" },
    { tableNo: 5, seats: 8, status: "Available" },
    { tableNo: 6, seats: 4, status: "Available" },
    { tableNo: 7, seats: 2, status: "Available" },
    { tableNo: 8, seats: 6, status: "Available" },
    { tableNo: 9, seats: 4, status: "Available" },
    { tableNo: 10, seats: 10, status: "Available" }
];

// Hàm tạo dữ liệu mẫu
const seedData = async () => {
    try {
        console.log('Bắt đầu tạo dữ liệu mẫu...');
        
        // Xóa dữ liệu cũ
        await Ingredient.deleteMany({});
        await MenuItem.deleteMany({});
        await Table.deleteMany({});
        
        console.log('Đã xóa dữ liệu cũ');
        
        // Tạo nguyên liệu
        const createdIngredients = await Ingredient.insertMany(sampleIngredients);
        console.log(`Đã tạo ${createdIngredients.length} nguyên liệu`);
        
        // Tạo bàn ăn
        const createdTables = await Table.insertMany(sampleTables);
        console.log(`Đã tạo ${createdTables.length} bàn ăn`);
        

        
        console.log('✅ Tạo dữ liệu mẫu thành công!');
        console.log('\n📋 Tóm tắt:');
        console.log(`- ${createdIngredients.length} nguyên liệu mẫu`);
        console.log(`- ${createdTables.length} bàn ăn mẫu`);
        console.log('\n💡 Bây giờ bạn có thể:');
        console.log('  1. Vào trang "Quản lý menu" để thêm món ăn mới');
        console.log('  2. Vào trang "Quản lý kho" để thêm nguyên liệu mới');
        console.log('  3. Tạo công thức cho món ăn với các nguyên liệu có sẵn');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
        process.exit(1);
    }
};

// Chạy seed data
seedData(); 