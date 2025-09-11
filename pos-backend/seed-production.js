const mongoose = require('mongoose');
const Table = require('./models/tableModel');
const config = require('./config/config');

// Kết nối database
mongoose.connect(config.databaseURI);

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

// Hàm tạo tables nếu chưa có
const seedTables = async () => {
    try {
        console.log('🔄 Kiểm tra và tạo tables...');
        
        // Kiểm tra số lượng tables hiện tại
        const existingTables = await Table.countDocuments();
        console.log(`📊 Hiện có ${existingTables} tables trong database`);
        
        if (existingTables === 0) {
            console.log('📝 Tạo dữ liệu tables mẫu...');
            const createdTables = await Table.insertMany(sampleTables);
            console.log(`✅ Đã tạo ${createdTables.length} tables thành công!`);
        } else {
            console.log('✅ Tables đã tồn tại, không cần tạo mới');
            
            // Kiểm tra table 3 có tồn tại không
            const table3 = await Table.findOne({ tableNo: 3 });
            if (table3) {
                console.log(`✅ Table 3 exists: ID=${table3._id}, Seats=${table3.seats}`);
            } else {
                console.log('⚠️  Table 3 không tồn tại, tạo mới...');
                const newTable3 = new Table({ tableNo: 3, seats: 6, status: "Available" });
                await newTable3.save();
                console.log(`✅ Đã tạo Table 3: ID=${newTable3._id}`);
            }
        }
        
        // Hiển thị tất cả tables
        const allTables = await Table.find().sort({ tableNo: 1 });
        console.log('\n📋 Danh sách tất cả tables:');
        allTables.forEach(table => {
            console.log(`  - Table ${table.tableNo}: ${table.seats} seats, Status: ${table.status}`);
        });
        
        console.log('\n🎉 Production seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi seed tables:', error);
        process.exit(1);
    }
};

// Chạy seed
seedTables();
