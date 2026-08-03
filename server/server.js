const http = require('http');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const SocketHandler = require('./socketHandler');

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "./.env",
  });
}

const app = require('./app');
const dbConnect = require('./db/dbConnect');
const cloudinary = require('cloudinary');

// Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});

// calling database connection function
dbConnect();

// ============ CREATE HTTP SERVER ============
const server = http.createServer(app);

// ============ INITIALIZE SOCKET.IO USING SOCKET HANDLER ============
const socketHandler = new SocketHandler(server);

// Get io instance and stores from socket handler
const io = socketHandler.getIO();
const connectedDrivers = socketHandler.getConnectedDrivers();
const connectedOperators = socketHandler.getConnectedOperators();

// ============ MAKE IO AND CONNECTED USERS AVAILABLE TO APP ============
app.set('io', io);
app.set('connectedDrivers', connectedDrivers);
app.set('connectedOperators', connectedOperators);

// ============ START SERVER ============
if (process.env.NODE_ENV !== "PRODUCTION") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  });
}

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);
});

// Export for Vercel
module.exports = { app, server, io, socketHandler };