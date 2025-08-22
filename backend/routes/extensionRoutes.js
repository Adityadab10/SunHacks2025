import express from "express";
import {
  summarizeVideoExtension,
  getTranscriptExtension,
} from "../controllers/extensionControllers.js";

const router = express.Router();

// POST /api/extension/summarize
// Summarize a YouTube video for browser extension (no DB save, no auth)
router.post("/summarize", summarizeVideoExtension);

// POST /api/extension/transcript
// Get transcript of a YouTube video for browser extension
router.post("/transcript", getTranscriptExtension);

// GET /api/extension/health
// Health check endpoint for extension
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Extension API service is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
