const mongoose = require('mongoose');
const Payment = require('./models/paymentModel');
const Order = require('./models/orderModel');
const config = require('./config/config');

// Kết nối database
mongoose.connect(config.databaseURI);

// Hàm tạo sample payments
const seedPayments = async () => {
    try {
        console.log('Bắt đầu tạo sample payments...');
        
        // Lấy danh sách orders có sẵn
        const orders = await Order.find();
        
        if (orders.length === 0) {
            console.log('Không có orders trong database. Vui lòng tạo orders trước.');
            process.exit(1);
        }
        
        // Xóa payments cũ
        await Payment.deleteMany({});
        console.log('Đã xóa payments cũ');
        
        // Tạo sample payments
        const samplePayments = [];
        
        // Tạo payments cho 70% orders (simulate completion rate)
        const completionRate = 0.7;
        const ordersToProcess = orders.slice(0, Math.floor(orders.length * completionRate));
        
        for (let i = 0; i < ordersToProcess.length; i++) {
            const order = ordersToProcess[i];
            
            // Random payment method
            const paymentMethods = ['cash', 'card', 'bank_transfer', 'qr_code'];
            const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            
            // Random status (mostly completed)
            const statuses = ['completed', 'completed', 'completed', 'pending', 'completed'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Create payment
            const payment = {
                orderId: order._id,
                amount: order.totalAmount || Math.floor(Math.random() * 10000) + 1000, // 1000-11000 HUF
                currency: 'HUF',
                status: randomStatus,
                paymentMethod: randomMethod,
                transactionId: `TXN_${Date.now()}_${i}`,
                notes: `Payment for order #${order._id.toString().slice(-6)}`,
                createdAt: new Date(order.createdAt.getTime() + (Math.random() * 30 * 60 * 1000)) // 0-30 minutes after order
            };
            
            samplePayments.push(payment);
        }
        
        // Add some additional random payments (for testing)
        const additionalPayments = 5;
        for (let i = 0; i < additionalPayments; i++) {
            const randomOrder = orders[Math.floor(Math.random() * orders.length)];
            const paymentMethods = ['cash', 'card', 'bank_transfer', 'qr_code'];
            const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            
            const payment = {
                orderId: randomOrder._id,
                amount: Math.floor(Math.random() * 15000) + 500, // 500-15500 HUF
                currency: 'HUF',
                status: 'completed',
                paymentMethod: randomMethod,
                transactionId: `TXN_EXTRA_${Date.now()}_${i}`,
                notes: `Additional test payment`,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
            };
            
            samplePayments.push(payment);
        }
        
        // Insert payments
        const createdPayments = await Payment.insertMany(samplePayments);
        
        console.log(`✅ Đã tạo ${createdPayments.length} sample payments`);
        console.log('\n📊 Thống kê:');
        
        const totalAmount = createdPayments.reduce((sum, p) => sum + p.amount, 0);
        const completedPayments = createdPayments.filter(p => p.status === 'completed');
        const completedAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        
        console.log(`- Tổng payments: ${createdPayments.length}`);
        console.log(`- Tổng tiền: ${totalAmount.toLocaleString()} HUF`);
        console.log(`- Payments hoàn thành: ${completedPayments.length}`);
        console.log(`- Tiền đã thu: ${completedAmount.toLocaleString()} HUF`);
        
        // Payment methods breakdown
        const methodCounts = {};
        createdPayments.forEach(p => {
            methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
        });
        
        console.log('\n💳 Phương thức thanh toán:');
        Object.entries(methodCounts).forEach(([method, count]) => {
            console.log(`- ${method}: ${count} payments`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi tạo sample payments:', error);
        process.exit(1);
    }
};

// Chạy seed payments
seedPayments();
