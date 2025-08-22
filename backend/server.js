import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import studyBoardYTRoutes from "./routes/studyboard-ytRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import extensionRoutes from './routes/extensionRoutes.js'
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from storage directory
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Routes
app.get("/", (req, res) => {
  res.send("PadhAI API is running...");
});

import translateRoutes from "./routes/translateRoutes.js";
app.use("/api/auth", authRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/studyboard-yt", studyBoardYTRoutes);
app.use("/api/video", videoRoutes);
app.use("/api", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/extension", extensionRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyGenie API is running",
    timestamp: new Date().toISOString(),
    services: {
      youtube: "active",
      studyBoard: "active",
      ocr: "active",
    },
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "File too large. Maximum size is 10MB.",
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected...");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
      console.log(
        `📊 Health check: http://localhost:${process.env.PORT}/api/health`
      );
      console.log(
        `🎥 YouTube API: http://localhost:${process.env.PORT}/api/youtube`
      );
    });
  })
  .catch((err) => console.error(err));

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    // Notify others that user is online
    socket.to(groupId).emit('userOnlineStatus', {
      groupId,
      userId: socket.userId,
      userName: socket.userName,
      isOnline: true
    });
  });

  socket.on('sendMessage', async ({ groupId, senderId, content }) => {
    // Save message to DB
    const Group = (await import('./model/group.js')).default;
    const User = (await import('./model/user.js')).default;
    // Convert senderId (firebaseUid) to MongoDB ObjectId
    const senderUser = await User.findOne({ firebaseUid: senderId });
    if (!senderUser) return;
    
    socket.userId = senderUser._id;
    socket.userName = senderUser.displayName;
    
    const message = { 
      sender: senderUser._id, 
      content, 
      timestamp: new Date() 
    };
    
    await Group.findByIdAndUpdate(groupId, { $push: { messages: message } });
    io.to(groupId).emit('receiveMessage', { groupId, message });
  });

  // Handle typing indicators
  socket.on('typing', ({ groupId, userId, userName, isTyping }) => {
    socket.to(groupId).emit('userTyping', {
      groupId,
      userId,
      userName,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    // Notify others that user is offline
    if (socket.groupId && socket.userId) {
      socket.to(socket.groupId).emit('userOnlineStatus', {
        groupId: socket.groupId,
        userId: socket.userId,
        userName: socket.userName,
        isOnline: false
      });
    }
  });
});

export default app;
