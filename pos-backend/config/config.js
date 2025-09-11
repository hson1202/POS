require("dotenv").config();

// Debug: Log environment variables
console.log("🔍 Environment Variables:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Not set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Not set");

// Validate required environment variables
if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required in environment variables!");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in environment variables!");
}

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.MONGODB_URI,
    nodeEnv : process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET,
    razorpyWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
});

module.exports = config;
