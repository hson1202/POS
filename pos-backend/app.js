const express = require("express");
const http = require("http");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { initializeSocket } = require("./config/socket");
const app = express();
const server = http.createServer(app);


const PORT = config.port;
connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        console.log('🌍 CORS Check:', { origin, timestamp: new Date().toISOString() });
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ CORS: No origin - allowing');
            return callback(null, true);
        }
        
        // Allow all localhost ports from 5173 to 5180 (development)
        if (origin.match(/^https?:\/\/localhost:(517[3-9]|5180)$/)) {
            console.log('✅ CORS: Localhost allowed');
            return callback(null, true);
        }
        
        // Allow Render domains (production)
        if (origin.match(/^https:\/\/.*\.onrender\.com$/)) {
            console.log('✅ CORS: Render domain allowed');
            return callback(null, true);
        }
        
        console.log('❌ CORS: Origin not allowed:', origin);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
}))
app.use(express.json({ limit: '50mb' })); // parse incoming request in json format with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // parse URL-encoded bodies
app.use(cookieParser())


// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        origin: req.get('origin'),
        host: req.get('host'),
        userAgent: req.get('user-agent'),
        cors: {
            allowedOrigins: [
                'localhost:5173-5180',
                '*.onrender.com'
            ]
        }
    });
})

// Setup endpoint (for production initialization)
const { setupTables, getSetupStatus } = require("./setup");
app.post("/api/setup/tables", setupTables);
app.get("/api/setup/status", getSetupStatus);

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/ingredients", require("./routes/ingredientRoute"));
app.use("/api/menu-items", require("./routes/menuItemRoute"));

// Global Error Handler
app.use(globalErrorHandler);

// Initialize Socket.io
initializeSocket(server);

// Server
server.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
    console.log(`🔌 Socket.io is ready for real-time communication`);
})