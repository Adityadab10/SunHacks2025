import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import studyBoardYTRoutes from "./routes/studyboard-ytRoutess.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/studyboard-yt", studyBoardYTRoutes);
app.use("/api/video", videoRoutes);

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
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
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
export default app;
