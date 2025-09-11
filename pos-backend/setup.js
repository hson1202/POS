const Table = require('./models/tableModel');

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

const setupTables = async (req, res, next) => {
    try {
        console.log('🔄 Setup: Kiểm tra và tạo tables...');
        
        // Kiểm tra số lượng tables hiện tại
        const existingTables = await Table.countDocuments();
        console.log(`📊 Hiện có ${existingTables} tables trong database`);
        
        if (existingTables === 0) {
            console.log('📝 Tạo dữ liệu tables mẫu...');
            const createdTables = await Table.insertMany(sampleTables);
            console.log(`✅ Đã tạo ${createdTables.length} tables thành công!`);
            
            return res.status(201).json({
                success: true,
                message: `Successfully created ${createdTables.length} tables`,
                data: {
                    created: createdTables.length,
                    tables: createdTables.map(t => ({ tableNo: t.tableNo, seats: t.seats }))
                }
            });
        } else {
            // Kiểm tra và tạo các table còn thiếu
            const missingTables = [];
            
            for (const sampleTable of sampleTables) {
                const exists = await Table.findOne({ tableNo: sampleTable.tableNo });
                if (!exists) {
                    missingTables.push(sampleTable);
                }
            }
            
            if (missingTables.length > 0) {
                const createdTables = await Table.insertMany(missingTables);
                console.log(`✅ Đã tạo ${createdTables.length} tables còn thiếu`);
                
                return res.status(201).json({
                    success: true,
                    message: `Created ${createdTables.length} missing tables`,
                    data: {
                        existing: existingTables,
                        created: createdTables.length,
                        newTables: createdTables.map(t => ({ tableNo: t.tableNo, seats: t.seats }))
                    }
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'All tables already exist',
                data: {
                    existing: existingTables,
                    created: 0
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Lỗi khi setup tables:', error);
        next(error);
    }
};

const getSetupStatus = async (req, res, next) => {
    try {
        const tableCount = await Table.countDocuments();
        const tables = await Table.find().sort({ tableNo: 1 });
        
        res.status(200).json({
            success: true,
            message: 'Setup status retrieved',
            data: {
                totalTables: tableCount,
                tables: tables.map(t => ({
                    id: t._id,
                    tableNo: t.tableNo,
                    seats: t.seats,
                    status: t.status
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { setupTables, getSetupStatus };
