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
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'https://pos-fe-ihui.onrender.com'
];

app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        console.log('🌍 CORS Check:', { origin, timestamp: new Date().toISOString() });
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ CORS: No origin - allowing');
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS: Origin allowed:', origin);
            return callback(null, true);
        }
        
        console.log('❌ CORS: Origin not allowed:', origin);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
}));
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
app.use("/api/analytics", require("./routes/analyticsRoute"));

// Global Error Handler
app.use(globalErrorHandler);

// Initialize Socket.io
initializeSocket(server);

// Server
server.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
    console.log(`🔌 Socket.io is ready for real-time communication`);
})