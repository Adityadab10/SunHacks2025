import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Hash,
  Clock,
  Search,
  Filter,
  Bot
} from 'lucide-react';

const ViewAllChatSessions = () => {
  const { mongoUid } = useUser();
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchChatSessions();
  }, [mongoUid]);

  const fetchChatSessions = async () => {
    if (!mongoUid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/youtube/chat/user/${mongoUid}/sessions`);
      const data = await response.json();
      if (data.success) {
        setChatSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredChatSessions = chatSessions
    .filter(session => 
      session.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.videoChannel.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastActiveAt) - new Date(a.lastActiveAt);
        case 'oldest':
          return new Date(a.lastActiveAt) - new Date(b.lastActiveAt);
        case 'messages':
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#111] to-[#222] text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">All Chat Sessions</h1>
                <p className="text-gray-400">Your AI video discussion history</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search chat sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none appearance-none"
                >
                  <option value="newest">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="messages">Most Messages</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="ml-3 text-gray-400">Loading chat sessions...</span>
            </div>
          ) : filteredChatSessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredChatSessions.map((session, index) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/chat/${session.sessionId}`)}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-cyan-500/20 p-3 rounded-lg shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                      <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors mb-2 line-clamp-2">
                        {session.videoTitle}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-1 mb-3">
                        {session.videoChannel}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-3 h-3" />
                        <span>{session.messageCount} messages</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(session.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="text-xs text-cyan-400 font-medium">
                      Continue conversation →
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">
                {searchTerm ? 'No chat sessions found' : 'No chat sessions yet'}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start your first AI conversation about a YouTube video'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/youtube')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Start Chatting
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllChatSessions;
