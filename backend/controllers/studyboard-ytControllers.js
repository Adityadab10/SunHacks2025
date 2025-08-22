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

// Controller to create study board from YouTube video (TEMPORARY - NOT SAVED)
export const createStudyBoard = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    // Validate required fields
    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
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

    console.log(`Creating temporary study board for video ID: ${videoId}`);

    // Get video metadata and transcript
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      getVideoTranscript(videoId)
    ]);

    console.log("Metadata and transcript fetched successfully");

    // Generate study board content using AI
    const studyContent = await generateStudyBoardContent(transcript, metadata);

    console.log("Study board content generated successfully");

    // Return temporary data (NOT SAVED TO DB)
    res.json({
      success: true,
      data: {
        video: {
          id: videoId,
          title: metadata.title,
          channel: metadata.channel,
          duration: metadata.duration,
          url: youtubeUrl,
        },
        content: studyContent,
        temporary: true
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

// Save study board with visibility options
export const saveStudyBoard = async (req, res) => {
  try {
    const { youtubeUrl, userId, studyBoardName, visibility, studyGroupId, content } = req.body;

    console.log('📚 SAVE STUDY BOARD REQUEST:', {
      studyBoardName,
      visibility,
      studyGroupId,
      userId
    });

    // Validate required fields
    if (!youtubeUrl || !userId || !studyBoardName || !visibility || !content) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided",
      });
    }

    // Validate visibility
    if (!['private', 'public', 'studygroup'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: "Invalid visibility option",
      });
    }

    // Validate study group if visibility is studygroup
    if (visibility === 'studygroup' && !studyGroupId) {
      return res.status(400).json({
        success: false,
        error: "Study group ID is required for study group visibility",
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

    // Get video metadata
    const metadata = await getVideoMetadata(videoId);

    // Save to MongoDB
    const studyBoard = new StudyBoardYT({
      userId: userId,
      youtubeVideoId: videoId,
      videoTitle: metadata.title,
      videoChannel: metadata.channel,
      videoDuration: metadata.duration,
      videoUrl: youtubeUrl,
      studyBoardName: studyBoardName.trim(),
      visibility: visibility,
      studyGroupId: visibility === 'studygroup' ? studyGroupId : undefined,
      content: content
    });

    const savedStudyBoard = await studyBoard.save();
    console.log("Study board saved to database with ID:", savedStudyBoard._id);

    // If it's a study group share, add it as a pinned message to the group
    if (visibility === 'studygroup' && studyGroupId) {
      console.log('🎯 PROCESSING STUDY GROUP SHARE:', {
        studyBoardId: savedStudyBoard._id,
        studyGroupId: studyGroupId,
        studyBoardName: studyBoardName
      });

      try {
        // Get user information for the message
        const User = (await import('../model/user.js')).default;
        const StudyGroup = (await import('../model/studyGroup.js')).default;
        
        const user = await User.findById(userId);
        console.log('👤 USER INFO FOR SHARE:', {
          userId,
          userName: user?.displayName,
          userPhoto: user?.photoURL
        });
        
        // Create a pinned message for the study board share
        const pinnedMessage = {
          sender: userId,
          senderName: user?.displayName || 'Someone',
          content: JSON.stringify({
            type: 'studyboard_share',
            studyBoardId: savedStudyBoard._id.toString(),
            studyBoardName: studyBoardName,
            videoTitle: metadata.title,
            videoChannel: metadata.channel,
            videoDuration: metadata.duration,
            sharedBy: user?.displayName || 'Someone',
            sharedByPhoto: user?.photoURL || null,
            sharedAt: new Date().toISOString()
          }),
          timestamp: new Date(),
          isPinned: true,
          isSystemMessage: true,
          messageType: 'studyboard_share'
        };

        console.log('📌 CREATING PINNED MESSAGE:', pinnedMessage);

        // Add the pinned message to the group's messages
        const updatedGroup = await StudyGroup.findByIdAndUpdate(
          studyGroupId,
          { $push: { messages: pinnedMessage } },
          { new: true }
        );

        console.log('💾 GROUP UPDATE RESULT:', {
          groupId: studyGroupId,
          groupFound: !!updatedGroup,
          messageCount: updatedGroup?.messages?.length || 0
        });

        // Use global socket if available for real-time notification
        if (global.io) {
          console.log('🔌 EMITTING SOCKET EVENTS TO GROUP:', studyGroupId);
          
          global.io.to(studyGroupId).emit('receiveMessage', {
            groupId: studyGroupId,
            message: pinnedMessage
          });
          
          // Also emit a special event for pinned messages update
          global.io.to(studyGroupId).emit('pinnedMessageAdded', {
            groupId: studyGroupId,
            pinnedMessage: pinnedMessage
          });
          
          console.log(`✅ Study board pinned to group ${studyGroupId} via socket`);
        } else {
          console.log('❌ Socket.io not available for real-time notification');
        }
      } catch (socketError) {
        console.error('❌ Error adding pinned message to group:', socketError);
        // Don't fail the save operation if group update fails
      }
    } else {
      console.log('ℹ️ NOT A STUDY GROUP SHARE:', { visibility, studyGroupId });
    }

    res.json({
      success: true,
      data: {
        studyBoardId: savedStudyBoard._id,
        studyBoardName: savedStudyBoard.studyBoardName,
        visibility: savedStudyBoard.visibility,
        studyGroupId: savedStudyBoard.studyGroupId,
        createdAt: savedStudyBoard.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Error saving study board:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save study board",
    });
  }
};

// Get public study boards
export const getPublicStudyBoards = async (req, res) => {
  try {
    const { page = 1, limit = 12, sortBy = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    let sortOptions = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most_liked':
        sortOptions = { likeCount: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const studyBoards = await StudyBoardYT.find({ visibility: 'public' })
      .populate('userId', 'displayName email photoURL')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyBoardYT.countDocuments({ visibility: 'public' });

    res.json({
      success: true,
      data: {
        studyBoards: studyBoards.map(board => ({
          id: board._id,
          studyBoardName: board.studyBoardName,
          videoTitle: board.videoTitle,
          videoChannel: board.videoChannel,
          videoDuration: board.videoDuration,
          videoUrl: board.videoUrl,
          youtubeVideoId: board.youtubeVideoId,
          likeCount: board.likeCount,
          dislikeCount: board.dislikeCount,
          likes: board.likes,
          dislikes: board.dislikes,
          creator: board.userId,
          createdAt: board.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching public study boards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch public study boards",
    });
  }
};

// Like/Dislike study board
export const toggleLikeDislike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'like' or 'dislike'

    if (!['like', 'dislike'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'like' or 'dislike'",
      });
    }

    const studyBoard = await StudyBoardYT.findById(id);
    if (!studyBoard) {
      return res.status(404).json({
        success: false,
        error: "Study board not found",
      });
    }

    // Check if it's a public study board
    if (studyBoard.visibility !== 'public') {
      return res.status(403).json({
        success: false,
        error: "Can only like/dislike public study boards",
      });
    }

    const userObjectId = userId;
    
    // Remove user from both arrays first
    studyBoard.likes = studyBoard.likes.filter(id => id.toString() !== userObjectId.toString());
    studyBoard.dislikes = studyBoard.dislikes.filter(id => id.toString() !== userObjectId.toString());

    // Add to appropriate array
    if (action === 'like') {
      studyBoard.likes.push(userObjectId);
    } else {
      studyBoard.dislikes.push(userObjectId);
    }

    // Update counts
    studyBoard.likeCount = studyBoard.likes.length;
    studyBoard.dislikeCount = studyBoard.dislikes.length;

    await studyBoard.save();

    res.json({
      success: true,
      data: {
        likeCount: studyBoard.likeCount,
        dislikeCount: studyBoard.dislikeCount,
        userAction: action,
        likes: studyBoard.likes,
        dislikes: studyBoard.dislikes
      }
    });
  } catch (error) {
    console.error("Error toggling like/dislike:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update like/dislike",
    });
  }
};

// Remove like/dislike
export const removeLikeDislike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const studyBoard = await StudyBoardYT.findById(id);
    if (!studyBoard) {
      return res.status(404).json({
        success: false,
        error: "Study board not found",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Remove user from both arrays
    studyBoard.likes = studyBoard.likes.filter(id => !id.equals(userObjectId));
    studyBoard.dislikes = studyBoard.dislikes.filter(id => !id.equals(userObjectId));

    // Update counts
    studyBoard.likeCount = studyBoard.likes.length;
    studyBoard.dislikeCount = studyBoard.dislikes.length;

    await studyBoard.save();

    res.json({
      success: true,
      data: {
        likeCount: studyBoard.likeCount,
        dislikeCount: studyBoard.dislikeCount,
        userAction: null
      }
    });
  } catch (error) {
    console.error("Error removing like/dislike:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove like/dislike",
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

// Get study boards for a specific group
export const getGroupStudyBoards = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "Group ID is required",
      });
    }

    console.log('📚 FETCHING STUDY BOARDS FOR GROUP:', groupId);

    // Find study boards that are shared with this specific group
    const studyBoards = await StudyBoardYT.find({ 
      visibility: 'studygroup',
      studyGroupId: groupId 
    })
    .populate('userId', 'displayName email photoURL')
    .sort({ createdAt: -1 })
    .limit(50);

    console.log('📚 FOUND STUDY BOARDS:', {
      groupId,
      count: studyBoards.length,
      boards: studyBoards.map(sb => ({
        id: sb._id,
        name: sb.studyBoardName,
        creator: sb.userId?.displayName
      }))
    });

    res.json({
      success: true,
      data: studyBoards.map(board => ({
        _id: board._id,
        studyBoardName: board.studyBoardName,
        videoTitle: board.videoTitle,
        videoChannel: board.videoChannel,
        videoDuration: board.videoDuration,
        videoUrl: board.videoUrl,
        youtubeVideoId: board.youtubeVideoId,
        userId: board.userId,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt
      }))
    });
  } catch (error) {
    console.error("❌ Error fetching group study boards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group study boards",
    });
  }
};
