import express from "express";
import {
  summarizeVideo,
  getTranscript,
  getUserYoutubeHistory,
  getYoutubeSummary,
  generateActiveRecallQuestions,
  gradeActiveRecallAnswers,
} from "../controllers/youtubeController.js";
// Import chat controllers
import {
  createOrGetChatSession,
  sendMessage,
  getChatHistory,
  getUserChatSessions,
  deleteChatSession
} from "../controllers/yt-chat-historyControllers.js";
import ytChatRoutes from './yt-chat-historyRoutes.js';

// Add GoogleGenerativeAI import for the new route
let genAI;

const router = express.Router();

// POST /api/youtube/summarize
// Summarize a YouTube video and save to database
router.post("/summarize", summarizeVideo);

// POST /api/youtube/transcript
// Get transcript of a YouTube video
router.post("/transcript", getTranscript);

// GET /api/youtube/history/:userId
// Get user's YouTube video history
router.get("/history/:userId", getUserYoutubeHistory);

// GET /api/youtube/user/:userId/history
// Get user's YouTube history
router.get("/user/:userId/history", getUserYoutubeHistory);

// GET /api/youtube/summary/:id
// Get specific YouTube video summary by ID
router.get("/summary/:id", getYoutubeSummary);

// POST /api/youtube/active-recall/transcript
// Get transcript specifically for active recall (no DB save)
router.post("/active-recall/transcript", async (req, res) => {
  try {
    const { youtubeUrl, videoTitle } = req.body;

    console.log('Active recall transcript request:', { youtubeUrl, videoTitle });

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    // Import the helper functions
    const { getVideoId, getVideoTranscript } = await import('../controllers/youtubeController.js');
    
    const videoId = getVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL format",
      });
    }

    console.log('Fetching transcript for Active Recall, video ID:', videoId);

    try {
      const transcript = await getVideoTranscript(videoId);
      
      console.log('Transcript fetched successfully, length:', transcript?.length || 0);

      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "No transcript available for this video"
        });
      }

      res.json({
        success: true,
        data: {
          transcript: transcript,
          videoId: videoId,
          videoTitle: videoTitle || 'YouTube Video'
        }
      });
    } catch (transcriptError) {
      console.error('Error fetching transcript:', transcriptError);
      res.status(400).json({
        success: false,
        error: transcriptError.message || 'Could not fetch video transcript'
      });
    }

  } catch (error) {
    console.error('Error in active recall transcript route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching transcript'
    });
  }
});

// POST /api/youtube/active-recall/questions
// Generate active recall questions from transcript
router.post("/active-recall/questions", generateActiveRecallQuestions);

// POST /api/youtube/active-recall/grade
// Grade active recall answers
router.post("/active-recall/grade", gradeActiveRecallAnswers);

// POST /api/youtube/active-recall/grade-question
// Grade individual active recall question
router.post("/active-recall/grade-question", async (req, res) => {
  try {
    // Initialize Gemini AI client
    if (!genAI) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY environment variable is not set",
        });
      }
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const { transcript, question, answer, difficulty, videoTitle } = req.body;

    console.log('Grading individual question:', {
      questionLength: question?.length || 0,
      answerLength: answer?.length || 0,
      difficulty,
      videoTitle
    });

    if (!transcript || !question || !answer) {
      return res.status(400).json({
        success: false,
        error: "Transcript, question, and answer are required"
      });
    }

    if (!answer.trim()) {
      return res.status(400).json({
        success: false,
        error: "Answer cannot be empty"
      });
    }

    const prompt = `Grade this active recall answer based on the video content. Rate each criteria from 1-10.

Video Title: ${videoTitle || 'YouTube Video'}
Video Content: ${transcript.substring(0, 5000)}

Question: ${question}
Student Answer: ${answer}
Question Difficulty: ${difficulty || 'medium'}

Grade on these criteria:
1. CLARITY (1-10): How clear and well-structured is the explanation?
2. UNDERSTANDING (1-10): How well does the answer demonstrate comprehension of core concepts?
3. ACCURACY (1-10): How factually correct is the answer compared to the video content?

Provide specific feedback for improvement, especially for scores below 8.

Return ONLY a JSON object in this exact format:
{
  "clarity": 8,
  "understanding": 7,
  "accuracy": 9,
  "feedback": "Specific feedback on how to improve the answer. Focus on areas that scored below 8."
}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    console.log('Raw grading response:', responseText);

    // Parse the JSON response
    let gradingData;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      gradingData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Error parsing grading JSON:', parseError);
      // Fallback grading
      gradingData = {
        clarity: 7,
        understanding: 7,
        accuracy: 7,
        feedback: "Please provide more detailed explanations and ensure accuracy with the video content."
      };
    }

    // Validate the structure
    if (typeof gradingData.clarity !== 'number' || 
        typeof gradingData.understanding !== 'number' || 
        typeof gradingData.accuracy !== 'number') {
      throw new Error('Invalid grading format received from AI');
    }

    res.json({
      success: true,
      data: gradingData
    });

  } catch (error) {
    console.error('Error grading individual question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grade answer'
    });
  }
});

// GET /api/youtube/health
// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "YouTube API service is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount chat routes under /chat
router.use('/chat', ytChatRoutes);







export default router;