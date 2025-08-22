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
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { firebaseUid, mongoUid } = useUser();
  const currentUser = auth.currentUser;
  const [minutesSpent, setMinutesSpent] = useState(0);
  const [streak, setStreak] = useState(1);
  const [studyBoards, setStudyBoards] = useState([]);
  const [youtubeHistory, setYoutubeHistory] = useState([]);
  const [loadingStudyBoards, setLoadingStudyBoards] = useState(false);
  const [loadingYouTube, setLoadingYouTube] = useState(false);

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

          {/* Profile Section - Only basic dynamic data */}
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

          {/* Stats Section - Only show dynamic time spent */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Stats</h2>
            <div className="flex items-center space-x-8">
              <div>
                <p className="text-gray-400 text-sm">Day Streak</p>
                <p className="text-2xl font-bold">{streak}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Time Spent</p>
                <p className="text-2xl font-bold">{minutesSpent} min</p>
              </div>
            </div>
          </div>

          {/* YouTube Study Boards Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Recent Study Boards</h2>
                  <p className="text-gray-400 text-sm">Your latest YouTube study materials</p>
                </div>
              </div>
              <a
                href="/youtube"
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm font-medium"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {loadingStudyBoards ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <span className="ml-2 text-gray-400">Loading study boards...</span>
              </div>
            ) : studyBoards.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyBoards.map((board, index) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => window.open(`/youtube`, '_self')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-500/20 p-2 rounded-lg">
                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors mb-1">
                          {truncateTitle(board.studyBoardName)}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {truncateTitle(board.videoTitle, 50)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{board.videoChannel}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(board.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BrainCircuit className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No study boards yet</p>
                <p className="text-gray-500 text-sm">Create your first study board from a YouTube video</p>
              </div>
            )}
          </motion.div>

          {/* YouTube History Section */}
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
                  <h2 className="text-xl font-semibold">Recent YouTube Summaries</h2>
                  <p className="text-gray-400 text-sm">Your latest video summaries</p>
                </div>
              </div>
              <a
                href="/youtube"
                className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1 text-sm font-medium"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {loadingYouTube ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                <span className="ml-2 text-gray-400">Loading YouTube history...</span>
              </div>
            ) : youtubeHistory.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {youtubeHistory.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => window.open(video.url, '_blank')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-500/20 p-2 rounded-lg">
                        <Play className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white group-hover:text-red-300 transition-colors mb-1">
                          {truncateTitle(video.title)}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{video.channel}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{video.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(video.createdAt)}
                          </span>
                          <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                            Summarized
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Youtube className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No YouTube summaries yet</p>
                <p className="text-gray-500 text-sm">Summarize your first YouTube video to get started</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
