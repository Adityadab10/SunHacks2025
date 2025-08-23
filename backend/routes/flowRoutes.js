import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

console.log('🚀 Flow Routes module loaded successfully');

// Initialize Gemini AI client
let genAI;

// Helper function to safely import models
const getModels = async () => {
  try {
    const StudyBoardYT = (await import('../model/studyboard-yt.js')).default;
    const YoutubeHistory = (await import('../model/youtubeHistory.js')).default;
    const YTChatHistory = (await import('../model/yt-chat-history.js')).default;
    return { StudyBoardYT, YoutubeHistory, YTChatHistory };
  } catch (error) {
    console.log('Some models not found, using fallback data');
    return { StudyBoardYT: null, YoutubeHistory: null, YTChatHistory: null };
  }
};

// Helper function to get user's complete study history
const getUserStudyHistory = async (userId) => {
  try {
    const { StudyBoardYT, YoutubeHistory, YTChatHistory } = await getModels();
    
    // If models don't exist, return empty arrays
    if (!StudyBoardYT || !YoutubeHistory || !YTChatHistory) {
      return {
        studyBoards: [],
        youtubeHistory: [],
        chatSessions: [],
        totalActivities: 0
      };
    }

    // Fetch all user data in parallel
    const [studyBoards, youtubeHistory, chatSessions] = await Promise.all([
      StudyBoardYT.find({ userId }).sort({ createdAt: -1 }).limit(20).catch(() => []),
      YoutubeHistory.find({ userId }).sort({ createdAt: -1 }).limit(20).catch(() => []),
      YTChatHistory.find({ userId }).sort({ createdAt: -1 }).limit(20).catch(() => [])
    ]);

    return {
      studyBoards: studyBoards || [],
      youtubeHistory: youtubeHistory || [],
      chatSessions: chatSessions || [],
      totalActivities: (studyBoards?.length || 0) + (youtubeHistory?.length || 0) + (chatSessions?.length || 0)
    };
  } catch (error) {
    console.error('Error fetching user history:', error);
    // Return fallback data
    return {
      studyBoards: [],
      youtubeHistory: [],
      chatSessions: [],
      totalActivities: 0
    };
  }
};

// Helper function to extract learning patterns
const analyzeLearningPatterns = (history) => {
  const patterns = {
    subjects: {},
    studyFrequency: {},
    preferredFormats: {},
    weakAreas: [],
    strongAreas: [],
    learningStyle: 'visual' // default
  };

  // Analyze study boards
  history.studyBoards.forEach(board => {
    const subject = extractSubjectFromTitle(board.videoTitle);
    patterns.subjects[subject] = (patterns.subjects[subject] || 0) + 1;
  });

  // Analyze YouTube history
  history.youtubeHistory.forEach(video => {
    const subject = extractSubjectFromTitle(video.title);
    patterns.subjects[subject] = (patterns.subjects[subject] || 0) + 1;
  });

  // Determine learning style based on activities
  const chatRatio = history.chatSessions.length / Math.max(history.totalActivities, 1);
  const studyBoardRatio = history.studyBoards.length / Math.max(history.totalActivities, 1);
  
  if (chatRatio > 0.4) patterns.learningStyle = 'interactive';
  else if (studyBoardRatio > 0.5) patterns.learningStyle = 'structured';
  else patterns.learningStyle = 'visual';

  return patterns;
};

// Helper function to extract subject from video title
const extractSubjectFromTitle = (title) => {
  const subjects = {
    'javascript': 'Programming',
    'python': 'Programming', 
    'react': 'Web Development',
    'math': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'dsa': 'Data Structures',
    'algorithm': 'Algorithms',
    'machine learning': 'AI/ML',
    'data science': 'Data Science'
  };

  const lowerTitle = title.toLowerCase();
  for (const [keyword, subject] of Object.entries(subjects)) {
    if (lowerTitle.includes(keyword)) return subject;
  }
  return 'General';
};

// Generate personalized study flow
router.post('/generate-flow', async (req, res) => {
  console.log('📝 POST /generate-flow route hit!');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🌐 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔗 Request URL:', req.url);
  console.log('🔗 Request method:', req.method);
  
  try {
    const { userId, goal, timeframe, currentLevel } = req.body;
    
    console.log('🔍 Extracted data:', { userId, goal, timeframe, currentLevel });

    if (!userId || !goal) {
      console.log('❌ Validation failed - missing userId or goal');
      return res.status(400).json({
        success: false,
        error: "User ID and goal are required"
      });
    }

    console.log('✅ Validation passed');
    console.log('🎯 Generating study flow for:', { userId, goal, timeframe, currentLevel });

    // Initialize Gemini AI
    if (!genAI) {
      console.log('🤖 Initializing Gemini AI...');
      const apiKey = process.env.GEMINI_API_KEY;
      console.log('🔑 API Key exists:', !!apiKey);
      console.log('🔑 API Key first 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');
      
      if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not found in environment');
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully');
    }

    // Get user's study history
    console.log('📚 Fetching user study history...');
    const userHistory = await getUserStudyHistory(userId);
    console.log('📊 User history fetched:', {
      studyBoards: userHistory.studyBoards.length,
      youtubeHistory: userHistory.youtubeHistory.length,
      chatSessions: userHistory.chatSessions.length,
      totalActivities: userHistory.totalActivities
    });
    
    const learningPatterns = analyzeLearningPatterns(userHistory);
    console.log('🧠 Learning patterns analyzed:', learningPatterns);

    // Generate AI-powered study flow
    console.log('🤖 Generating AI response...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3096,
      },
    });

    const prompt = `Based on this user's learning history and goal, create a personalized 6-step study flow path. 

USER PROFILE:
- Goal: ${goal}
- Timeframe: ${timeframe || '3 months'}
- Current Level: ${currentLevel || 'intermediate'}
- Learning Style: ${learningPatterns.learningStyle}
- Total Activities: ${userHistory.totalActivities}

LEARNING HISTORY:
- Study Boards Created: ${userHistory.studyBoards.length}
- Videos Studied: ${userHistory.youtubeHistory.length}
- Chat Sessions: ${userHistory.chatSessions.length}
- Top Subjects: ${Object.entries(learningPatterns.subjects).slice(0, 3).map(([s, c]) => `${s} (${c})`).join(', ') || 'None yet'}

RECENT STUDY TOPICS:
${userHistory.youtubeHistory.slice(0, 5).map(v => `- ${v.title || v.videoTitle || 'Study session'}`).join('\n') || '- No recent study history'}

Create a practical, progressive 6-step learning path. Return ONLY valid JSON in this exact format:

{
  "flowSteps": [
    {
      "stepNumber": 1,
      "title": "Foundation Building",
      "description": "Clear description of what to focus on in this step",
      "duration": "2 weeks",
      "keyActivities": ["Activity 1", "Activity 2", "Activity 3"],
      "resources": ["Online tutorials", "Practice problems"],
      "color": "#4F46E5"
    },
    {
      "stepNumber": 2,
      "title": "Skill Development",
      "description": "Build core competencies",
      "duration": "3 weeks",
      "keyActivities": ["Practice coding", "Build projects", "Study patterns"],
      "resources": ["Coding platforms", "Project tutorials"],
      "color": "#06B6D4"
    },
    {
      "stepNumber": 3,
      "title": "Intermediate Practice",
      "description": "Apply knowledge to real scenarios",
      "duration": "3 weeks",
      "keyActivities": ["Solve medium problems", "Code reviews", "Join communities"],
      "resources": ["LeetCode", "GitHub", "Discord groups"],
      "color": "#10B981"
    },
    {
      "stepNumber": 4,
      "title": "Advanced Concepts",
      "description": "Dive into complex topics",
      "duration": "4 weeks",
      "keyActivities": ["Advanced algorithms", "System design", "Optimization"],
      "resources": ["Advanced courses", "Tech blogs", "Research papers"],
      "color": "#F59E0B"
    },
    {
      "stepNumber": 5,
      "title": "Real-world Application",
      "description": "Apply skills to projects",
      "duration": "4 weeks",
      "keyActivities": ["Build portfolio", "Contribute to open source", "Mock interviews"],
      "resources": ["Portfolio platforms", "Open source repos", "Interview prep"],
      "color": "#EF4444"
    },
    {
      "stepNumber": 6,
      "title": "Mastery & Beyond",
      "description": "Achieve proficiency and set next goals",
      "duration": "Ongoing",
      "keyActivities": ["Teach others", "Mentor newcomers", "Advanced certifications"],
      "resources": ["Teaching platforms", "Mentorship programs", "Certification sites"],
      "color": "#8B5CF6"
    }
  ],
  "analytics": {
    "strengthAreas": ["Problem solving", "Logical thinking"],
    "improvementAreas": ["Time management", "Consistency"],
    "recommendedStudyHours": 15,
    "difficultyProgression": ["Beginner", "Intermediate", "Advanced"]
  },
  "motivationalMessage": "Based on your learning history and goals, this personalized path will help you achieve mastery. Stay consistent and trust the process!"
}`;

    console.log('📝 Prompt created, length:', prompt.length);
    console.log('🚀 Sending request to Gemini...');
    
    const result = await model.generateContent(prompt);
    console.log('✅ Gemini response received');
    
    const response = await result.response;
    let content = response.text().trim();
    
    console.log('📄 Raw response length:', content.length);
    console.log('📄 First 200 chars of response:', content.substring(0, 200));
    
    // Clean up JSON response
    if (content.includes('```json')) {
      console.log('🧹 Cleaning JSON response...');
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      console.log('🧹 Cleaned content length:', content.length);
    }
    
    console.log('🔄 Parsing JSON...');
    const flowData = JSON.parse(content);
    console.log('✅ JSON parsed successfully');
    console.log('📊 Flow data structure:', {
      flowSteps: flowData.flowSteps?.length || 0,
      hasAnalytics: !!flowData.analytics,
      hasMessage: !!flowData.motivationalMessage
    });

    // Add user-specific metrics
    console.log('📈 Calculating user metrics...');
    const metrics = {
      totalStudyTime: userHistory.totalActivities * 45, // estimate 45 min per activity
      consistency: calculateConsistency(userHistory),
      progressRate: calculateProgressRate(userHistory),
      subjects: learningPatterns.subjects
    };
    console.log('📊 Metrics calculated:', metrics);

    const responseData = {
      success: true,
      data: {
        ...flowData,
        userMetrics: metrics,
        historyStats: {
          totalActivities: userHistory.totalActivities,
          studyBoards: userHistory.studyBoards.length,
          videosWatched: userHistory.youtubeHistory.length,
          chatSessions: userHistory.chatSessions.length
        }
      }
    };

    console.log('🎉 Success! Sending response...');
    console.log('📦 Response data structure:', Object.keys(responseData.data));
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in generate-flow route:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate study flow',
      details: error.message
    });
  }
});

// Helper function to calculate consistency
const calculateConsistency = (history) => {
  if (history.totalActivities === 0) return 0;
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentActivities = [
    ...history.studyBoards.filter(s => new Date(s.createdAt) > sevenDaysAgo),
    ...history.youtubeHistory.filter(v => new Date(v.createdAt) > sevenDaysAgo),
    ...history.chatSessions.filter(c => new Date(c.createdAt) > sevenDaysAgo)
  ];
  
  return Math.min(100, (recentActivities.length / 7) * 100);
};

// Helper function to calculate progress rate
const calculateProgressRate = (history) => {
  if (history.totalActivities < 5) return 'Getting Started';
  if (history.totalActivities < 15) return 'Building Momentum';
  if (history.totalActivities < 30) return 'Consistent Learner';
  return 'Advanced Learner';
};

// Get user learning analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userHistory = await getUserStudyHistory(userId);
    const learningPatterns = analyzeLearningPatterns(userHistory);
    
    // Generate activity timeline for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timelineData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activitiesOnDate = [
        ...userHistory.studyBoards.filter(s => s.createdAt.toISOString().split('T')[0] === dateStr),
        ...userHistory.youtubeHistory.filter(v => v.createdAt.toISOString().split('T')[0] === dateStr),
        ...userHistory.chatSessions.filter(c => c.createdAt.toISOString().split('T')[0] === dateStr)
      ];
      
      timelineData.push({
        date: dateStr,
        activities: activitiesOnDate.length,
        estimatedTime: activitiesOnDate.length * 45 // 45 min per activity
      });
    }

    res.json({
      success: true,
      data: {
        learningPatterns,
        timelineData,
        summary: {
          totalActivities: userHistory.totalActivities,
          consistency: calculateConsistency(userHistory),
          progressRate: calculateProgressRate(userHistory),
          averageActivitiesPerWeek: userHistory.totalActivities > 0 ? Math.round(userHistory.totalActivities / 4) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  console.log('❤️ Health check endpoint hit');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌐 Request IP:', req.ip);
  console.log('🔗 Request URL:', req.url);
  
  res.json({
    success: true,
    message: "Study Flow API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a test route
router.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({
    success: true,
    message: "Flow routes are working!",
    timestamp: new Date().toISOString()
  });
});

// Log all routes when module loads
console.log('📋 Available flow routes:');
console.log('   POST /generate-flow');
console.log('   GET /analytics/:userId');
console.log('   GET /health');
console.log('   GET /test');

export default router;
