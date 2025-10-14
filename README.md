# SunHacks2025

A comprehensive **AI-powered study platform** that transforms learning through intelligent content processing, personalized study materials, and interactive features.  
Built for **SunHacks 2025**, this platform leverages modern AI technologies to revolutionize the educational experience.  

---

## 🌟 Features  

### 📚 Core Study Tools  
- **YouTube Study Board**: Analyze YouTube videos and generate summaries, flashcards, and quizzes  
- **Document Processing**: Upload PDFs, images, or handwritten notes with OCR technology  
- **AI-Generated Flashcards**: Intelligent flashcard generation from any content  
- **Interactive Quizzes**: Auto-generated quizzes with detailed explanations  
- **Smart Summaries**: Brief, detailed, and bullet-point summaries  

### 🎯 Personalized Learning  
- **Study Flow Generator**: AI-powered 6-step personalized learning paths  
- **Progress Analytics**: Track learning progress with intelligent insights  
- **AI Tutor**: Get explanations for incorrect answers and concept clarification  
- **Story Mode**: Convert study materials into engaging audio narratives  

### 🌐 Collaborative Features  
- **Study Groups**: Real-time collaborative study sessions  
- **Public Study Boards**: Share and discover study materials  
- **Chrome Extension**: Seamless YouTube and PDF summarization  

### 🎨 Modern Interface  
- **Multi-language Support**: English, Spanish, French, German, Japanese, Korean, Hindi, Chinese  
- **Dark/Light Theme Toggle**  
- **Responsive Design** (mobile + desktop)  
- **Smooth Animations** with Framer Motion  

---

## 🛠 Tech Stack  

### 🔹 Frontend  
- React 18 with Hooks & Context  
- Vite for fast builds  
- TailwindCSS for styling  
- Framer Motion for animations  
- Socket.io Client (real-time features)  
- React Router, React Hot Toast  

### 🔹 Backend  
- Node.js with Express  
- Socket.io (real-time communication)  
- MongoDB + Mongoose  
- Google Generative AI (Gemini) for content processing  
- Veo 3 API (video generation)  
- OCR Integration  
- JWT Authentication  

### 🔹 Chrome Extension  
- Plasmo Framework (Manifest V3)  
- React + TypeScript  
- Chrome Storage API  
- TailwindCSS  

### 🔹 AI/ML Services  
- Google Gemini 2.0 Flash (content generation)  
- Veo 3 (video creation)  
- OCR Technology (text extraction)  
- Text-to-Speech (audio narratives)  

---

## 🚀 Getting Started  

### ✅ Prerequisites  
- Node.js (v16 or higher)  
- MongoDB database  
- API Keys:  
  - Google Gemini  
  - Veo 3  

---

### 🔧 Installation  

**Clone the repository**  
git clone https://github.com/Adityadab10/SunHacks2025.git
cd SunHacks2025

**Backend Setup**
cd backend
npm install
cp .env.example .env   # Add your API keys and DB URL
npm start

**Frontend Setup**
cd frontend
npm install
npm run dev

Chrome Extension Setup
cd extension
pnpm install
pnpm dev

➡ Load the extension in Chrome:

1. Open chrome://extensions/
2. Enable Developer mode
3. Click Load unpacked and select the build folder

🔑 Environment Variables

**Backend (.env)**
MONGODB_URI=your_mongodb_connection_string

GEMINI_API_KEY=your_google_gemini_api_key

VEO_API_KEY=your_veo3_api_key

JWT_SECRET=your_jwt_secret

PORT=8000

**Frontend (.env)**

VITE_API_BASE_URL=http://localhost:8000

📱 Usage
🎥 YouTube Study Board

Paste a YouTube URL

Get AI-generated summaries, flashcards, and quizzes

Take adaptive quizzes with personalized feedback

📄 Document Upload & Processing

Upload PDFs, images, or handwritten notes

OCR extracts text

Generate summaries, flashcards, and quizzes

🧭 Study Flow Generator

Set goals & timeframe

AI generates a 6-step study plan

Track learning progress

🧩 Chrome Extension

Summarize YouTube videos or PDFs instantly

Save notes directly to your workspace

🔧 API Endpoints
📌 Core

POST /api/youtube/process → Process YouTube videos

POST /api/flashcards → Generate flashcards

POST /api/studyboard → Create study boards

POST /api/flow/generate → Generate study flows

POST /api/video/generate → Generate videos (Veo 3)

🔑 Authentication

POST /api/auth/login

POST /api/auth/register

GET /api/auth/profile

🔴 Real-time Features

Socket.io endpoints for study groups

Live collaboration & progress tracking


**🏗 Project Structure**
SunHacks2025/
├── frontend/        # React frontend
│   ├── components/  # Reusable UI
│   ├── pages/       # App pages
│   ├── context/     # State management
│   ├── services/    # API integration
│   └── utils/       # Utilities
├── backend/         # Node.js backend
│   ├── controllers/ # Request handlers
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   ├── middleware/  # Custom middleware
│   └── utils/       # Helpers
├── extension/       # Chrome extension
│   ├── components/  
│   ├── utils/       
│   └── popup.tsx   
└── README.md


**🤝 Contributing**

We welcome contributions!

Fork the repo

Create a branch (git checkout -b feature/amazing-feature)

Commit changes (git commit -m "Add amazing feature")

Push (git push origin feature/amazing-feature)

Open a Pull Request

📄 License

This project is licensed under the MIT License – see the LICENSE


✨ Built with ❤️ for SunHacks 2025 ✨
