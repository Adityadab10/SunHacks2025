import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  Youtube, 
  Clock, 
  User, 
  Play, 
  ChevronRight, 
  Calendar,
  Loader2,
  AlertCircle,
  MessageCircle,
  Bot,
  Hash
} from 'lucide-react';

const Dashboard = () => {
  const { firebaseUid, mongoUid } = useUser();
  const currentUser = auth.currentUser;
  const [minutesSpent, setMinutesSpent] = useState(0);
  const [streak, setStreak] = useState(1);
  const [studyBoards, setStudyBoards] = useState([]);
  const [youtubeHistory, setYoutubeHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingStudyBoards, setLoadingStudyBoards] = useState(false);
  const [loadingYouTube, setLoadingYouTube] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Fetch session time from backend (same as Profile)
  useEffect(() => {
    let intervalId;
    async function fetchSessionTime() {
      if (firebaseUid) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const res = await fetch(`http://localhost:5000/api/user/${firebaseUid}/session?date=${today}`);
          const data = await res.json();
          setMinutesSpent(Math.floor((data.totalTime || 0) / 60));
        } catch (err) {
          setMinutesSpent(0);
        }
      }
    }
    fetchSessionTime();
    intervalId = setInterval(fetchSessionTime, 60000);
    return () => clearInterval(intervalId);
  }, [firebaseUid]);

  // Streak logic (simple: checks localStorage for login days)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakDays = JSON.parse(localStorage.getItem('loginDays') || '[]');
    const todayStr = today.toISOString().slice(0, 10);
    if (!streakDays.includes(todayStr)) {
      streakDays.push(todayStr);
      localStorage.setItem('loginDays', JSON.stringify(streakDays));
    }
    // Count consecutive days
    streakDays = streakDays.sort();
    let count = 1;
    for (let i = streakDays.length - 2; i >= 0; i--) {
      const prev = new Date(streakDays[i]);
      const curr = new Date(streakDays[i + 1]);
      if ((curr - prev) === 86400000) {
        count++;
      } else {
        break;
      }
    }
    setStreak(count);
  }, []);

  // Fetch study boards
  useEffect(() => {
    async function fetchStudyBoards() {
      if (mongoUid) {
        setLoadingStudyBoards(true);
        try {
          const response = await fetch(`http://localhost:5000/api/studyboard-yt/user/${mongoUid}`);
          const data = await response.json();
          if (data.success) {
            setStudyBoards(data.data.studyBoards.slice(0, 3)); // Show only recent 3
          }
        } catch (error) {
          console.error('Error fetching study boards:', error);
        } finally {
          setLoadingStudyBoards(false);
        }
      }
    }
    fetchStudyBoards();
  }, [mongoUid]);

  // Fetch YouTube history
  useEffect(() => {
    async function fetchYouTubeHistory() {
      if (firebaseUid) {
        setLoadingYouTube(true);
        try {
          console.log('Fetching YouTube history for Firebase UID:', firebaseUid);
          const response = await fetch(`http://localhost:5000/api/youtube/user/${firebaseUid}/history`);
          const data = await response.json();
          console.log('YouTube history response:', data);
          if (data.success) {
            setYoutubeHistory(data.data.videos.slice(0, 4)); // Show only recent 4
          } else {
            console.error('Failed to fetch YouTube history:', data.error);
          }
        } catch (error) {
          console.error('Error fetching YouTube history:', error);
        } finally {
          setLoadingYouTube(false);
        }
      }
    }
    fetchYouTubeHistory();
  }, [firebaseUid]);

  // Fetch chat history
  useEffect(() => {
    async function fetchChatHistory() {
      if (mongoUid) {
        setLoadingChat(true);
        try {
          const response = await fetch(`http://localhost:5000/api/youtube/chat/user/${mongoUid}/sessions`);
          const data = await response.json();
          if (data.success) {
            setChatHistory(data.data.sessions.slice(0, 4)); // Show only recent 4
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        } finally {
          setLoadingChat(false);
        }
      }
    }
    fetchChatHistory();
  }, [mongoUid]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateTitle = (title, maxLength = 60) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-gray-400">Ready to continue your learning journey?</p>
          </div>

          {/* Profile Section */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-4">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-gray-400">{currentUser?.email}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Day Streak: <b>{streak}</b></p>
                  <p>Time spent on this website: <b>{minutesSpent}</b> min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-500/20 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm">Day Streak</p>
                <p className="text-2xl font-bold text-blue-400">{streak}</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500/20 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm">Time Spent</p>
                <p className="text-2xl font-bold text-green-400">{minutesSpent}m</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-500/20 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">Study Boards</p>
                <p className="text-2xl font-bold text-purple-400">{studyBoards.length}</p>
              </div>
              <div className="text-center">
                <div className="bg-cyan-500/20 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-gray-400 text-sm">Chat Sessions</p>
                <p className="text-2xl font-bold text-cyan-400">{chatHistory.length}</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* YouTube Study Boards Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Study Boards</h2>
                    <p className="text-gray-500 text-sm">AI-generated study materials</p>
                  </div>
                </div>
                <a
                  href="/youtube"
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm font-medium group"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {loadingStudyBoards ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span className="ml-2 text-gray-400">Loading...</span>
                </div>
              ) : studyBoards.length > 0 ? (
                <div className="space-y-3">
                  {studyBoards.map((board, index) => (
                    <motion.div
                      key={board.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => window.open(`/youtube`, '_self')}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-purple-500/20 p-2 rounded-lg shrink-0">
                          <BrainCircuit className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors mb-1 line-clamp-1">
                            {truncateTitle(board.studyBoardName, 40)}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                            {truncateTitle(board.videoTitle, 35)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 truncate">
                              {board.videoChannel}
                            </span>
                            <span className="text-xs text-gray-500 shrink-0">
                              {formatDate(board.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <BrainCircuit className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-1">No study boards yet</p>
                  <p className="text-gray-600 text-sm">Create your first study board</p>
                </div>
              )}
            </motion.div>

            {/* Chat History Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Chat Sessions</h2>
                    <p className="text-gray-500 text-sm">AI video discussions</p>
                  </div>
                </div>
                <a
                  href="/youtube"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1 text-sm font-medium group"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {loadingChat ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-gray-400">Loading...</span>
                </div>
              ) : chatHistory.length > 0 ? (
                <div className="space-y-3">
                  {chatHistory.map((session, index) => (
                    <motion.div
                      key={session.sessionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => window.open(`/youtube`, '_self')}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-cyan-500/20 p-2 rounded-lg shrink-0">
                          <Bot className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white group-hover:text-cyan-300 transition-colors mb-1 line-clamp-1">
                            {truncateTitle(session.videoTitle, 40)}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                            {session.videoChannel}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Hash className="w-3 h-3" />
                                <span>{session.messageCount} messages</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">
                              {formatDate(session.lastActiveAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-1">No chat sessions yet</p>
                  <p className="text-gray-600 text-sm">Start your first AI conversation</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* YouTube History Section - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Recent Summaries</h2>
                  <p className="text-gray-500 text-sm">Your latest YouTube video summaries</p>
                </div>
              </div>
              <a
                href="/youtube"
                className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1 text-sm font-medium group"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {loadingYouTube ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                <span className="ml-2 text-gray-400">Loading...</span>
              </div>
            ) : youtubeHistory.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {youtubeHistory.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-red-500/30 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
                    onClick={() => window.open(video.url, '_blank')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-500/20 p-2 rounded-lg shrink-0">
                        <Play className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white group-hover:text-red-300 transition-colors mb-2 line-clamp-2 leading-tight">
                          {truncateTitle(video.title, 50)}
                        </h3>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span className="truncate">{video.channel}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{video.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(video.createdAt)}
                          </span>
                          <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            ✓ Summarized
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Youtube className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-2">No YouTube summaries yet</p>
                <p className="text-gray-600 text-sm">Summarize your first video to get started</p>
                <motion.a
                  href="/youtube"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  <Youtube className="w-4 h-4" />
                  <span>Start Summarizing</span>
                </motion.a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
