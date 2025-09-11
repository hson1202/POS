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
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost ports from 5173 to 5180
        if (origin.match(/^https?:\/\/localhost:(517[3-9]|5180)$/)) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    }
}))
app.use(express.json({ limit: '50mb' })); // parse incoming request in json format with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // parse URL-encoded bodies
app.use(cookieParser())


// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

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