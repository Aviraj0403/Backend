// app.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';  // Import the HTTP module
import { Server } from 'socket.io';  // Import Socket.IO
import { ApiError } from './src/utils/ApiError.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routers/auth.routes.js';
import foodRoutes from './src/routers/food.routes.js'; 
import uploadRoutes from './src/routers/upload.routes.js';
import masterRoutes from './src/routers/master.routes.js';
import { verifyJWT } from './src/middleware/auth.middleware.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Use environment variable for CORS
  }
});
app.use(helmet());
app.use(cookieParser());
// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} is not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow credentials (cookies, etc.)
};


app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes); // Auth routes don't require JWT
app.use('/api/food', foodRoutes);
app.use('/api/upload', uploadRoutes);
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
  res.status(404).json({ message: 'Not Found' });
});

// Socket.IO setup
const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (msg) => {
      console.log('message: ' + msg);
      socket.broadcast.emit('message', msg);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

setupSocketIO(io);

export default server;
