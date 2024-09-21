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
import authRoutes from './routers/auth.routes.js';
import foodRoutes from './routers/food.routes.js'; 
import uploadRoutes from './routers/upload.routes.js';
// import managerRoutes from './routers/manager.routes.js';
import masterRoutes from './routers/master.routes.js';
import { verifyJWT } from './middleware/auth.middleware.js';

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

// Middleware
app.use(cors({
  credentials: true 
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes); // Auth routes don't require JWT
app.use('/api/food',  foodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', verifyJWT, masterRoutes);
// app.use('/api/managers', verifyJWT, managerRoutes); // Register manager routes

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
// app.get('*', (req, res) => {
//   res.status(404).send('Server Check');
// });

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
