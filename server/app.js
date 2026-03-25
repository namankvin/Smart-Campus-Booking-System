const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const classroomRoutes = require('./routes/classroom');
const menuRoutes = require('./routes/menu');
const cabRoutes = require('./routes/cab');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notification');

const createAppServer = () => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  app.use(helmet());
  app.use(morgan('combined'));
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes(io));
  app.use('/api/classrooms', classroomRoutes);
  app.use('/api/menus', menuRoutes(io));
  app.use('/api/cabs', cabRoutes(io));
  app.use('/api/admin', adminRoutes(io));
  app.use('/api/notifications', notificationRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  io.on('connection', (socket) => {
    const authHeader = socket.handshake.auth?.token || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.id) {
          socket.join(`user:${payload.id}`);
        }
      } catch (error) {
        // Keep connection alive without user-scoped room.
      }
    }

    socket.on('disconnect', () => {});
  });

  return { app, server, io };
};

module.exports = { createAppServer };