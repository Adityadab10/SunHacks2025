# SunHacks2025
SunHacks2025 - AI-Powered Study Platform
A comprehensive AI-powered study platform that transforms learning through intelligent content processing, personalized study materials, and interactive features. Built for SunHacks 2025, this platform leverages modern AI technologies to revolutionize the educational experience.

🌟 Features
📚 Core Study Tools
**YouTube Study Board**: Analyze YouTube videos and generate summaries, flashcards, and quizzes
**Document Processing**: Upload PDFs, images, or handwritten notes with OCR technology
**AI-Generated Flashcards**: Intelligent flashcard generation from any content
**Interactive Quizzes**: Auto-generated quizzes with detailed explanations
**Smart Summaries**: Brief, detailed, and bullet-point summaries

🎯 Personalized Learning
**Study Flow Generator**: AI-powered 6-step personalized learning paths
**Progress Analytics**: Track learning progress with intelligent insights
**AI Tutor**: Get explanations for incorrect answers and concept clarification
**Story Mode**: Convert study materials into engaging audio narratives

🌐 Collaborative Features
**Study Groups**: Real-time collaborative study sessions
**Public Study Boards**: Share and discover study materials
**Chrome Extension**: Seamless YouTube and PDF summarization

🎨 Modern Interface
**Multi-language Support**: English, Spanish, French, German, Japanese, Korean, Hindi, Chinese
**Dark/Light Theme Toggle**: Customizable interface
**Responsive Design**: Works on all devices
**Smooth Animations**: Enhanced user experience with Framer Motion

🛠 Tech Stack
Frontend
React 18 with modern hooks and context
Vite for fast development and building
TailwindCSS for responsive styling
Framer Motion for animations
Socket.io Client for real-time features
React Router for navigation
React Hot Toast for notifications
Backend
Node.js with Express framework
Socket.io for real-time communication
MongoDB with Mongoose ODM
Google Generative AI (Gemini) for content processing
Veo 3 API for video generation
OCR Integration for handwritten notes
JWT Authentication
Chrome Extension
Plasmo Framework (Manifest V3)
React + TypeScript
Chrome Storage API
TailwindCSS
AI/ML Services
Google Gemini 2.0 Flash for content generation
Veo 3 for video creation
OCR Technology for text extraction
Text-to-Speech for audio features
🚀 Getting Started
Prerequisites
Node.js (v16 or higher)
MongoDB database
Google Gemini API key
Veo 3 API key (for video generation)

**Installation**
Clone the repository:
git clone https://github.com/your-username/SunHacks2025.git
cd SunHacks2025

**Backend Setup**:
cd backend
npm install
# Create .env file with required environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

npm start

**Frontend Setup**:
cd frontend
npm install
npm run dev

**Chrome Extension Setup:**
cd extension
pnpm install
pnpm dev

# Load the extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select the build folder

Environment Variables
Create .env files in both backend and frontend directories:

**Backend (.env)**:
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
VEO_API_KEY=your_veo3_api_key
JWT_SECRET=your_jwt_secret
PORT=8000

**Frontend (.env)**:
VITE_API_BASE_URL=http://localhost:8000

📱 Usage
YouTube Study Board
Navigate to the YouTube page
Paste a YouTube URL
Get AI-generated summaries, flashcards, and quizzes
Take adaptive quizzes with personalized feedback
Document Upload & Processing
Go to the Upload page
Upload PDFs, images, or handwritten notes
AI extracts text using OCR
Generate comprehensive study materials
Study Flow Generator
Visit the Study Flow page
Set your learning goals and timeframe
AI analyzes your learning history
Get a personalized 6-step study plan
Chrome Extension
Install the extension
Visit any YouTube video or upload PDFs
Get instant summaries and save to notes
Access all saved content in the Notes Workspace

🔧 API Endpoints
Core Endpoints
POST /api/youtube/process - Process YouTube videos
POST /api/flashcards - Generate flashcards from content
POST /api/studyboard - Create study boards
POST /api/flow/generate - Generate study flows
POST /api/video/generate - Generate videos with Veo 3
Authentication
POST /api/auth/login - User login
POST /api/auth/register - User registration
GET /api/auth/profile - Get user profile
Real-time Features
Socket.io endpoints for study groups
Live collaboration on study materials
Real-time progress tracking

🏗 Project Structure
SunHacks2025/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── context/        # React context providers
│   │   ├── services/       # API integration services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend server
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API route definitions
│   ├── middleware/        # Custom middleware
│   └── utils/             # Backend utilities
├── extension/              # Chrome extension
│   ├── components/        # Extension components
│   ├── utils/            # Extension utilities
│   └── popup.tsx         # Main popup interface
└── README.md             # Project documentation


🤝 Contributing
We welcome contributions! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
SunHacks 2025 for the opportunity to build this project
Google Gemini for powerful AI capabilities
Veo 3 for video generation features
Open Source Community for the amazing tools and libraries


Built with ❤️ for SunHacks 2025
