import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import YTChatHistory from '../model/yt-chat-history.js';
import Youtube from '../model/youtube.js';

let genAI;

// Initialize Gemini AI
const initializeAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
};

// Helper function to extract video ID from URL
const getVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
    throw new Error("Could not fetch video transcript");
  }
};

// Create or get existing chat session
export const createOrGetChatSession = async (req, res) => {
  try {
    const { userId, videoUrl, videoTitle, videoChannel } = req.body;

    if (!userId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "User ID and video URL are required"
      });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL"
      });
    }

    // Check if chat session already exists
    let chatSession = await YTChatHistory.findOne({ userId, videoId });

    if (!chatSession) {
      // Create new chat session
      chatSession = new YTChatHistory({
        userId,
        videoId,
        videoTitle: videoTitle || 'YouTube Video',
        videoChannel: videoChannel || 'Unknown Channel',
        videoUrl,
        messages: []
      });
      await chatSession.save();
    } else {
      // Update last active time
      chatSession.lastActiveAt = new Date();
      await chatSession.save();
    }

    res.json({
      success: true,
      data: {
        sessionId: chatSession._id,
        videoId: chatSession.videoId,
        videoTitle: chatSession.videoTitle,
        videoChannel: chatSession.videoChannel,
        sessionName: chatSession.sessionName,
        messageCount: chatSession.messages.length,
        lastActiveAt: chatSession.lastActiveAt
      }
    });

  } catch (error) {
    console.error('Error creating/getting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create or get chat session'
    });
  }
};

// Get chat history for a session
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await YTChatHistory.findById(sessionId);
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found"
      });
    }

    // Transform messages to match frontend expectations
    const transformedMessages = chatSession.messages.map(msg => ({
      id: msg._id || Math.random().toString(36),
      message: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: msg.timestamp
    }));

    res.json({
      success: true,
      data: {
        session: {
          sessionId: chatSession._id,
          videoId: chatSession.videoId,
          videoTitle: chatSession.videoTitle,
          videoChannel: chatSession.videoChannel,
          videoUrl: chatSession.videoUrl
        },
        messages: transformedMessages
      }
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
};

// Send message and get AI response
export const sendMessage = async (req, res) => {
  try {
    initializeAI();
    
    const { sessionId } = req.params;
    const { message, userId } = req.body;

    console.log('Received message request:', { sessionId, message, userId });

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    // Get chat session
    const chatSession = await YTChatHistory.findById(sessionId);
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found"
      });
    }

    console.log('Found chat session:', chatSession.videoTitle);

    // Get video transcript and summary
    let transcript = '';
    let summary = '';
    
    try {
      // Try to get existing summary from Youtube collection
      const existingVideo = await Youtube.findOne({ 
        userId: chatSession.userId, 
        videoId: chatSession.videoId 
      });
      
      if (existingVideo) {
        summary = existingVideo.briefSummary || '';
        console.log('Found existing summary');
      }
      
      // Get fresh transcript
      transcript = await getVideoTranscript(chatSession.videoId);
      console.log('Fetched transcript, length:', transcript.length);
    } catch (error) {
      console.warn('Could not fetch transcript or summary:', error.message);
    }

    // Add user message to chat history
    chatSession.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Prepare context for AI
    const contextPrompt = `You are an AI assistant helping users understand and discuss a YouTube video. 

Video Information:
Title: ${chatSession.videoTitle}
Channel: ${chatSession.videoChannel}

${summary ? `Video Summary: ${summary}\n\n` : ''}
${transcript ? `Video Transcript: ${transcript.substring(0, 8000)}\n\n` : ''}

Chat History:
${chatSession.messages.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's current question: ${message}

Please provide a helpful, informative response about the video content. If the user asks about specific topics, use the transcript and summary to provide accurate information. Be conversational and engaging.`;

    console.log('Sending request to Gemini API...');

    // Get AI response
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(contextPrompt);
    const aiResponse = await result.response;
    const responseText = aiResponse.text().trim();

    console.log('Received AI response, length:', responseText.length);

    // Add AI response to chat history
    chatSession.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date()
    });

    // Update last active time
    chatSession.lastActiveAt = new Date();
    await chatSession.save();

    console.log('Chat session updated and saved');

    res.json({
      success: true,
      data: {
        aiResponse: responseText,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
};

// Get all chat sessions for a user
export const getUserChatSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const chatSessions = await YTChatHistory.find({ userId })
      .sort({ lastActiveAt: -1 })
      .limit(50)
      .select('videoId videoTitle videoChannel sessionName lastActiveAt createdAt messages');

    res.json({
      success: true,
      data: {
        count: chatSessions.length,
        sessions: chatSessions.map(session => ({
          sessionId: session._id,
          videoId: session.videoId,
          videoTitle: session.videoTitle,
          videoChannel: session.videoChannel,
          sessionName: session.sessionName,
          messageCount: session.messages.length,
          lastActiveAt: session.lastActiveAt,
          createdAt: session.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user chat sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions'
    });
  }
};

// Delete a chat session
export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await YTChatHistory.findByIdAndDelete(sessionId);
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found"
      });
    }

    res.json({
      success: true,
      message: "Chat session deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat session'
    });
  }
};
