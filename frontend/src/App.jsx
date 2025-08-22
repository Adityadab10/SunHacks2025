import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from './context/UserContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import UploadAndChat from './pages/MainkTrial';
import YouTubePage from './pages/Youtube';
import FlashCards from './pages/FlashCards';
import StudyGroup from './pages/StudyGroup';
import { io } from 'socket.io-client';
import ChatSession from "./pages/ChatSession"
import StudyboardPage from "./pages/StudyboardPage"
import PublicStudyboard from "./pages/PublicStudyboard"

window.socket = io('http://localhost:5000');

const AppContent = () => {
  const { firebaseUid, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Only show Navbar for non-dashboard routes */}
      {!firebaseUid }
      <Routes>
        {firebaseUid ? (
          // User is logged in - show all authenticated pages
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/youtube" element={<YouTubePage />} />
            <Route path="/study-group" element={<StudyGroup />} />
            <Route path="/studyboard/:boardId" element={<StudyboardPage />} />
            <Route path="/public-studyboards" element={<PublicStudyboard />} />
            <Route path="/chat/:sessionId" element={<ChatSession />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          // User is not logged in - show landing, login, and register
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path='/mainktrial' element={<UploadAndChat />} />
            <Route path='/mainktrial2' element={<FlashCards />} />
          </>
        )}
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

const App = () => {
  return (
    <UserProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </UserProvider>
  );
};

export default App