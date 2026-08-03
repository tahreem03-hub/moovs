// socketHandler.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

/**
 * Socket.IO handler with authentication and room management
 * Supports both driver and operator roles
 */
class SocketHandler {
  constructor(server, options = {}) {
    this.io = socketIo(server, {
      cors: {
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            // Add your production URLs here
          ];
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      ...options
    });

    // Store connected users by role
    this.connectedDrivers = new Map();
    this.connectedOperators = new Map();

    // Auth middleware
    this.io.use(this.authMiddleware.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

  }

  /**
   * Authentication middleware - verifies JWT token from cookie
   */
  authMiddleware(socket, next) {
    try {
      const raw = socket.handshake.headers.cookie || '';
      const { token } = cookie.parse(raw);
      if (!token) return next(new Error('Unauthorized - No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.id; // Verified user ID from token
      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      next(new Error('Unauthorized - Invalid token'));
    }
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId; // From verified token
    const role = socket.handshake.query.role; // From connection query

    // Handle different roles
    if (userId && role === 'driver') {
      this.handleDriverConnection(socket, userId);
    } 
    else if (userId && role === 'operator') {
      this.handleOperatorConnection(socket, userId);
    }
    else {
      console.log(`⚠️ Unknown connection attempt: Role=${role}, UserId=${userId}`);
      socket.emit('error', { message: 'Invalid role or missing userId' });
      socket.disconnect();
      return;
    }

    // Setup disconnect handler
    socket.on('disconnect', () => {
      this.handleDisconnect(socket, userId, role);
    });

    // Setup error handler
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Handle driver connection
   */
  handleDriverConnection(socket, userId) {
    // Join driver room - matches notificationService room `driver-<recipient>`
    socket.join(`driver-${userId}`);

    // Store driver connection
    this.connectedDrivers.set(userId, {
      socketId: socket.id,
      connectedAt: new Date()
    });


    // Confirm connection
    socket.emit('connected', {
      message: 'Connected to WebSocket server as driver',
      userId: userId,
      role: 'driver',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle operator connection
   */
  handleOperatorConnection(socket, userId) {
    // Join operator room - matches notificationService room `operator-<recipient>`
    socket.join(`operator-${userId}`);

    // Store operator connection
    this.connectedOperators.set(userId, {
      socketId: socket.id,
      connectedAt: new Date()
    });


    // Confirm connection
    socket.emit('connected', {
      message: 'Connected to WebSocket server as operator',
      userId: userId,
      role: 'operator',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(socket, userId, role) {
    console.log(`Client disconnected: ${socket.id}, Role: ${role}`);

    if (role === 'driver') {
      for (const [key, value] of this.connectedDrivers.entries()) {
        if (value.socketId === socket.id) {
          this.connectedDrivers.delete(key);
          console.log(`Driver ${key} disconnected. Total drivers: ${this.connectedDrivers.size}`);
          break;
        }
      }
    } 
    else if (role === 'operator') {
      for (const [key, value] of this.connectedOperators.entries()) {
        if (value.socketId === socket.id) {
          this.connectedOperators.delete(key);
          console.log(`Operator ${key} disconnected. Total operators: ${this.connectedOperators.size}`);
          break;
        }
      }
    }
  }

  /**
   * Get the io instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Get connected drivers map
   */
  getConnectedDrivers() {
    return this.connectedDrivers;
  }

  /**
   * Get connected operators map
   */
  getConnectedOperators() {
    return this.connectedOperators;
  }

  /**
   * Check if a driver is connected
   */
  isDriverConnected(driverId) {
    return this.connectedDrivers.has(driverId);
  }

  /**
   * Check if an operator is connected
   */
  isOperatorConnected(operatorId) {
    return this.connectedOperators.has(operatorId);
  }
}

module.exports = SocketHandler;