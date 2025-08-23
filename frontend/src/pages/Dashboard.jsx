import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend, Cell 
} from 'recharts';

const Dashboard = () => {
  const { firebaseUid, mongoUid } = useUser();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const [streak, setStreak] = useState(1);
  const [studyBoards, setStudyBoards] = useState([]);
  const [youtubeHistory, setYoutubeHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingStudyBoards, setLoadingStudyBoards] = useState(false);
  const [loadingYouTube, setLoadingYouTube] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [activityStats, setActivityStats] = useState([]);
  const [timelineStats, setTimelineStats] = useState([]);

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
          console.log('Fetching study boards for mongoUid:', mongoUid);
          const response = await fetch(`http://localhost:5000/api/studyboard-yt/user/${mongoUid}`);
          const data = await response.json();
          console.log('Study boards response:', data);
          if (data.success) {
            setStudyBoards(data.data.studyBoards.slice(0, 3)); // Show only recent 3
          } else {
            console.error('Failed to fetch study boards:', data.error);
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
            setYoutubeHistory(data.data.videos.slice(0, 3)); // Show only recent 3
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
            setChatHistory(data.data.sessions.slice(0, 3)); // Show only recent 3
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

  // Weekly stats and activity distribution
  useEffect(() => {
    // Create weekly stats with specific pattern
    const getDayActivity = (day) => {
      switch (day) {
        case 'Thu':
          return { studyBoards: 1, chats: 1, videos: 1 }; // Low activity
        case 'Fri':
          return { studyBoards: 8, chats: 10, videos: 7 }; // High activity
        case 'Sat':
          return { studyBoards: 4, chats: 5, videos: 4 }; // Medium activity
        default:
          return { studyBoards: 0, chats: 0, videos: 0 }; // No activity
      }
    };

    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day,
        ...getDayActivity(day)
      };
    }).reverse();
    setWeeklyStats(last7Days);

    // Activity distribution
    setActivityStats([
      { name: 'Study Boards', value: studyBoards.length, color: '#74AA9C' },
      { name: 'Chat Sessions', value: chatHistory.length, color: '#6366f1' },
      { name: 'Video Summaries', value: youtubeHistory.length, color: '#ef4444' }
    ]);

    // Timeline data
    const timelineData = [...Array(24)].map((_, i) => ({
      hour: `${i}:00`,
      activity: Math.floor(Math.random() * 100)
    }));
    setTimelineStats(timelineData);
  }, [studyBoards.length, chatHistory.length, youtubeHistory.length]);

  // Replace dummy stats with real data fetching
  useEffect(() => {
    async function fetchAnalytics() {
      if (!mongoUid) return;

      try {
        // Reset states
        setWeeklyStats([]);
        setActivityStats([]);
        setTimelineStats([]);

        // Fetch all analytics in parallel for better performance
        const [weeklyRes, distributionRes, timelineRes] = await Promise.all([
          fetch(`http://localhost:5000/api/analytics/weekly-activity/${mongoUid}`),
          fetch(`http://localhost:5000/api/analytics/activity-distribution/${mongoUid}`),
          fetch(`http://localhost:5000/api/analytics/daily-timeline/${mongoUid}`)
        ]);

        // Handle weekly activity
        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json();
          if (weeklyData.success && weeklyData.data?.length > 0) {
            setWeeklyStats(weeklyData.data);
          }
        }

        // Handle activity distribution
        if (distributionRes.ok) {
          const distributionData = await distributionRes.json();
          if (distributionData.success) {
            const stats = [
              { name: 'Study Boards', value: distributionData.data.studyBoards, color: '#74AA9C' },
              { name: 'Chat Sessions', value: distributionData.data.chatSessions, color: '#6366f1' },
              { name: 'Video Summaries', value: distributionData.data.videoSummaries, color: '#ef4444' }
            ].filter(item => item.value > 0);
            if (stats.length > 0) {
              setActivityStats(stats);
            }
          }
        }

        // Handle timeline data
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          if (timelineData.success && timelineData.data?.length > 0) {
            setTimelineStats(timelineData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }

    fetchAnalytics();
    // Poll every 5 minutes for fresh data
    const intervalId = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(intervalId);
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

  // Update renderStats to show empty state messages
  const renderStats = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid lg:grid-cols-2 gap-8 mb-8"
    >
      {/* Activity Distribution */}
      <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-white">Activity Distribution</h3>
        <div className="h-[300px]">
          {activityStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityStats}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {activityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Start using features to see activity distribution
            </div>
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-white">Weekly Activity</h3>
        <div className="h-[300px]">
          {weeklyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="studyBoards" name="Study Boards" fill="#74AA9C" />
                <Bar dataKey="chats" name="Chat Sessions" fill="#6366f1" />
                <Bar dataKey="videos" name="Video Summaries" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Complete activities to see weekly statistics
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="lg:col-span-2 bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-white">Today's Activity Timeline</h3>
        <div className="h-[200px]">
          {timelineStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#74AA9C" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Complete activities to see today's timeline
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#111] to-[#222] text-white flex font-sans relative">
      {/* Green accent floating shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 bg-[#74AA9C]/30 rounded-full blur-2xl"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>
      <MainSidebar />
      <div className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section with Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl p-10 mb-10 overflow-hidden shadow-2xl bg-gradient-to-br from-black via-[#222] to-[#222] border border-[#74AA9C]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#74AA9C]/20 via-black/30 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="relative">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-2xl border-4 border-[#74AA9C]/40 shadow-2xl object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-[#74AA9C]/30 to-black/30 rounded-2xl flex items-center justify-center border-4 border-[#74AA9C]/40 shadow-2xl">
                      <User className="w-14 h-14 text-[#74AA9C]" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent drop-shadow-lg">
                    Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}!
                  </h1>
                  <p className="text-[#74AA9C]/80 text-lg">Ready to continue your learning journey?</p>
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-4 text-center">
                <div className="p-5 bg-gradient-to-br from-[#74AA9C]/40 to-black/30 rounded-2xl border border-[#74AA9C]/50 shadow-lg min-w-[90px]">
                  <div className="text-3xl font-bold text-[#74AA9C] mb-1 font-mono">{streak}</div>
                  <div className="text-[#74AA9C]/80 text-xs font-semibold">STREAK</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section - Updated to remove minutes */}
          {renderStats()}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Study Boards Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg"
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
                  href="/studyboards"
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
                  {studyBoards.slice(0, 3).map((board, index) => (
                    <motion.div
                      key={board.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        console.log('Navigating to study board:', board);
                        // Try different possible ID fields
                        const boardId = board._id || board.id || board.studyBoardId;
                        if (boardId) {
                          navigate(`/studyboard/${boardId}`);
                        } else {
                          console.error('No valid ID found for board:', board);
                        }
                      }}
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
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg"
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
                  href="/chat-sessions"
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
                  {chatHistory.slice(0, 3).map((session, index) => (
                    <motion.div
                      key={session.sessionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate(`/chat/${session.sessionId}`)}
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

            {/* YouTube History Section - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30 shadow-lg"
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
                  href="/summaries"
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {youtubeHistory.slice(0, 4).map((video, index) => (
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
      
      {/* Custom Styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .glass {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

