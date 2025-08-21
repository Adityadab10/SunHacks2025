import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import fetch from "node-fetch";
import StudyBoardYT from "../model/studyboard-yt.js";

// Initialize Gemini AI client
let genAI;

// Helper function to extract video ID from YouTube URL
const getVideoId = (url) => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Helper function to get video transcript
const getVideoTranscript = async (videoId) => {
  try {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    return transcriptArray.map((item) => item.text).join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw new Error(
      "Could not fetch video transcript. The video might not have captions available."
    );
  }
};

// Helper function to convert ISO 8601 duration to readable format
const convertDuration = (isoDuration) => {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Helper function to get video metadata using YouTube Data API v3
const getVideoMetadata = async (videoId) => {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
      console.warn("YouTube API key not found, using fallback metadata");
      return {
        title: "YouTube Video",
        duration: "Unknown",
        channel: "Unknown Channel",
      };
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        title: item.snippet.title || "YouTube Video",
        channel: item.snippet.channelTitle || "Unknown Channel",
        duration: item.contentDetails.duration
          ? convertDuration(item.contentDetails.duration)
          : "Unknown",
      };
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching video metadata:", error.message);
    return {
      title: "YouTube Video",
      duration: "Unknown",
      channel: "Unknown Channel",
    };
  }
};

// Generate study board content from transcript
const generateStudyBoardContent = async (transcript, metadata) => {
  // Initialize Gemini AI client
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  // Create comprehensive prompt for all study materials
  const prompt = `Based on this YouTube video transcript, generate comprehensive study materials in the exact JSON format below. Make sure the response is valid JSON only, no additional text.

Video Title: ${metadata.title}
Channel: ${metadata.channel}
Duration: ${metadata.duration}

Transcript: ${transcript}

Generate a JSON response with this exact structure:
{
  "tldr": "A concise 2-3 sentence summary of the main points",
  "detailedSummary": "A comprehensive multi-paragraph summary with detailed explanations",
  "summary": ["Bullet point 1", "Bullet point 2", "Bullet point 3", "Bullet point 4", "Bullet point 5"],
  "flashcards": [
    {
      "question": "Important concept question",
      "answer": "Detailed answer explanation"
    }
  ],
  "quiz": [
    {
      "question": "Multiple choice question about key concept",
      "options": [
        {"label": "A", "text": "Option text", "isCorrect": false},
        {"label": "B", "text": "Option text", "isCorrect": true},
        {"label": "C", "text": "Option text", "isCorrect": false},
        {"label": "D", "text": "Option text", "isCorrect": false}
      ],
      "correctAnswer": "B",
      "explanation": "Detailed explanation of why this is correct"
    }
  ]
}

Requirements:
- Generate 5-7 bullet points for summary
- Create 8-10 flashcards covering key concepts
- Create 5-8 quiz questions with 4 options each
- Ensure all quiz questions have exactly one correct answer
- Make flashcards focused on key terms, definitions, and important concepts
- Make quiz questions test understanding of main ideas and details
- Ensure JSON is properly formatted and valid`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    
    // Try to parse JSON, handling potential markdown code blocks
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.includes('```')) {
      jsonContent = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsedContent = JSON.parse(jsonContent);
    
    // Validate required fields
    if (!parsedContent.tldr || !parsedContent.detailedSummary || !parsedContent.summary || 
        !parsedContent.flashcards || !parsedContent.quiz) {
      throw new Error('Generated content missing required fields');
    }
    
    return parsedContent;
  } catch (error) {
    console.error('Error generating study board content:', error);
    throw new Error(`Failed to generate study board content: ${error.message}`);
  }
};

// Controller to create study board from YouTube video
export const createStudyBoard = async (req, res) => {
  try {
    const { youtubeUrl, userId, studyBoardName } = req.body;

    // Validate required fields
    if (!youtubeUrl || !userId) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL and User ID are required",
      });
    }

    // Extract video ID
    const videoId = getVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL",
      });
    }

    console.log(`Creating study board for video ID: ${videoId} for user: ${userId}`);

    // Get video metadata and transcript
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      getVideoTranscript(videoId)
    ]);

    console.log("Metadata and transcript fetched successfully");

    // Generate study board content using AI
    const studyContent = await generateStudyBoardContent(transcript, metadata);

    console.log("Study board content generated successfully");

    // Generate default study board name if not provided
    const defaultName = studyBoardName || `${metadata.title.substring(0, 50)}... - Study Board`;

    // Save to MongoDB
    const studyBoard = new StudyBoardYT({
      userId: userId,
      youtubeVideoId: videoId,
      videoTitle: metadata.title,
      videoChannel: metadata.channel,
      videoDuration: metadata.duration,
      videoUrl: youtubeUrl,
      studyBoardName: defaultName,
      content: studyContent
    });

    const savedStudyBoard = await studyBoard.save();
    console.log("Study board saved to database with ID:", savedStudyBoard._id);

    res.json({
      success: true,
      data: {
        studyBoardId: savedStudyBoard._id,
        video: {
          id: videoId,
          title: metadata.title,
          channel: metadata.channel,
          duration: metadata.duration,
          url: youtubeUrl,
        },
        studyBoardName: defaultName,
        content: studyContent,
        createdAt: savedStudyBoard.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating study board:", error);
    
    let errorMessage = "Failed to create study board";
    if (error.message.includes("transcript")) {
      errorMessage = "Could not fetch video transcript. The video might not have captions available.";
    } else if (error.message.includes("GEMINI_API_KEY")) {
      errorMessage = "AI service configuration error.";
    } else if (error.message.includes("generate study board content")) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Get user's study boards
export const getUserStudyBoards = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const studyBoards = await StudyBoardYT.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        count: studyBoards.length,
        studyBoards: studyBoards.map(board => ({
          id: board._id,
          studyBoardName: board.studyBoardName,
          videoTitle: board.videoTitle,
          videoChannel: board.videoChannel,
          videoDuration: board.videoDuration,
          videoUrl: board.videoUrl,
          youtubeVideoId: board.youtubeVideoId,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching study boards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch study boards",
    });
  }
};

// Get specific study board
export const getStudyBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const studyBoard = await StudyBoardYT.findById(id);

    if (!studyBoard) {
      return res.status(404).json({
        success: false,
        error: "Study board not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: studyBoard._id,
        studyBoardName: studyBoard.studyBoardName,
        video: {
          id: studyBoard.youtubeVideoId,
          title: studyBoard.videoTitle,
          channel: studyBoard.videoChannel,
          duration: studyBoard.videoDuration,
          url: studyBoard.videoUrl,
        },
        content: studyBoard.content,
        createdAt: studyBoard.createdAt,
        updatedAt: studyBoard.updatedAt
      },
    });
  } catch (error) {
    console.error("Error fetching study board:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch study board",
    });
  }
};

// Update study board name
export const updateStudyBoardName = async (req, res) => {
  try {
    const { id } = req.params;
    const { studyBoardName } = req.body;

    if (!studyBoardName || !studyBoardName.trim()) {
      return res.status(400).json({
        success: false,
        error: "Study board name is required",
      });
    }

    const studyBoard = await StudyBoardYT.findByIdAndUpdate(
      id,
      { studyBoardName: studyBoardName.trim() },
      { new: true }
    );

    if (!studyBoard) {
      return res.status(404).json({
        success: false,
        error: "Study board not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: studyBoard._id,
        studyBoardName: studyBoard.studyBoardName,
        updatedAt: studyBoard.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating study board name:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update study board name",
    });
  }
};

// Delete study board
export const deleteStudyBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const studyBoard = await StudyBoardYT.findByIdAndDelete(id);

    if (!studyBoard) {
      return res.status(404).json({
        success: false,
        error: "Study board not found",
      });
    }

    res.json({
      success: true,
      message: "Study board deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting study board:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete study board",
    });
  }
};
