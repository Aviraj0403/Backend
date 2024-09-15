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

import foodRoutes from './routers/food.routes.js'; 
import uploadRoutes from './routers/upload.routes.js';  

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production security
  }
});

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/food', foodRoutes);
app.use('/api/upload', uploadRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
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

app.get('*', (req, res) => {
  res.status(404).send('Server Check');
});

// Socket.IO setup
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

export default server;
