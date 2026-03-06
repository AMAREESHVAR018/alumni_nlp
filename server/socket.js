const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./utils/logger");

let io;
const onlineUsers = new Map(); // userId => socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.id})`);
    onlineUsers.set(socket.user.id, socket.id);
    
    // Notify others that this user is online
    io.emit("user_status", { userId: socket.user.id, status: "online" });

    // Join a conversation room so messages can be scoped to the conversation
    socket.on("join_conversation", ({ conversationId }) => {
      if (conversationId) {
        socket.join(conversationId);
        logger.info(`User ${socket.user.id} joined conversation room: ${conversationId}`);
      }
    });

    socket.on("send_message", (data) => {
      // data: { receiverId, text, conversationId, messageId, createdAt }
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", data);
      }
    });

    socket.on("typing", (data) => {
      // data: { receiverId, conversationId }
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", { 
          userId: socket.user.id, 
          conversationId: data.conversationId 
        });
      }
    });

    socket.on("stop_typing", (data) => {
      // data: { receiverId, conversationId }
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop_typing", { 
          userId: socket.user.id, 
          conversationId: data.conversationId 
        });
      }
    });

    socket.on("mark_read", (data) => {
      // data: { senderId, conversationId }
      const senderSocketId = onlineUsers.get(data.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_read", { 
          userId: socket.user.id, 
          conversationId: data.conversationId 
        });
      }
    });

    // Keep mark_seen as an alias for backward compatibility
    socket.on("mark_seen", (data) => {
      const senderSocketId = onlineUsers.get(data.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_seen", { 
          userId: socket.user.id, 
          conversationId: data.conversationId 
        });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${socket.user.id})`);
      onlineUsers.delete(socket.user.id);
      io.emit("user_status", { userId: socket.user.id, status: "offline" });
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/**
 * Emit an event to a specific user by their userId.
 * Returns true if the user was online and the event was sent, false otherwise.
 * Safe to call even when Socket.IO is not yet initialized.
 */
const emitToUser = (userId, event, data) => {
  if (!io) return false;
  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

module.exports = { initSocket, getIo, emitToUser };
