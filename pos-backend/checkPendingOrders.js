const mongoose = require("mongoose");
const Order = require("./models/orderModel");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant_pos", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkAndFixOrders() {
  try {
    console.log("🔍 Checking orders without status...");
    
    // Find orders without status
    const ordersWithoutStatus = await Order.find({ 
      $or: [
        { orderStatus: { $exists: false } },
        { orderStatus: null },
        { orderStatus: "" }
      ]
    });
    
    console.log(`📊 Found ${ordersWithoutStatus.length} orders without status`);
    
    if (ordersWithoutStatus.length > 0) {
      console.log("📝 Orders without status:");
      ordersWithoutStatus.forEach(order => {
        console.log(`- Order ID: ${order._id}, Customer: ${order.customerDetails?.name || 'Unknown'}`);
      });
      
      // Update all orders without status to "Pending"
      const result = await Order.updateMany(
        { 
          $or: [
            { orderStatus: { $exists: false } },
            { orderStatus: null },
            { orderStatus: "" }
          ]
        },
        { orderStatus: "Pending" }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} orders to "Pending" status`);
    }
    
    // Check all orders and their statuses
    const allOrders = await Order.find();
    console.log("\n📋 All orders status summary:");
    
    const statusCount = {};
    allOrders.forEach(order => {
      const status = order.orderStatus || "No Status";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} orders`);
    });
    
    console.log("\n🎉 Check completed!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkAndFixOrders(); 