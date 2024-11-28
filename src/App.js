// app.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';  // Import the HTTP module
import { Server } from 'socket.io';  // Import Socket.IO
import { ApiError } from './utils/ApiError.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/auth.routes.js';
import foodRoutes from './routers/food.routes.js'; 
import uploadRoutes from './routers/upload.routes.js';
import masterRoutes from './routers/master.routes.js';
import tableRoutes from './routers/dinningTable.routes.js'; // Import the database connection function
import offerRoutes from './routers/offer.routes.js';
import scanRoutes from './routers/scan.routes.js';
import orderRoutes from './routers/order.routes.js'
import employeeRoutes from './routers/employee.routes.js';
import attendanceRoutes from './routers/attendance.routes.js'
import { verifyJWT } from './middleware/auth.middleware.js';
import { setupSocketIO } from './socket.js'; 
import HTTP from 'http';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS || "*", // Use environment variable for CORS
    methods: ["GET", "POST"],  // Specify allowed methods
    credentials: true,  // Allow cookies and authentication headers
  }
});
app.use(helmet());
app.use(cookieParser());
// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} is not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, etc.)
  methods: ['GET', 'POST', 'OPTIONS'],  // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],  // Add X-CSRF-Token to allowed headers
};

app.options('*', cors(corsOptions));  // Preflight handling
app.use(cors(corsOptions));  // Enable CORS for all routes

app.get('/check',(req,res)=>
{
  res.send("Server Check");
})

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//test
// Routes
app.use('/api/auth', authRoutes); 
// Auth routes don't require JWT
app.use('/api/scan', scanRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/offer', offerRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);


app.use('/api/users', verifyJWT, masterRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err); // Log the error for debugging
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found get it' });
});


setupSocketIO(io);

export default server;
