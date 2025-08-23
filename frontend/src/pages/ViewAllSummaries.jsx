import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  Youtube, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  User,
  Clock,
  Search,
  Filter,
  Play,
  ExternalLink
} from 'lucide-react';

const ViewAllSummaries = () => {
  const { firebaseUid } = useUser();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchSummaries();
  }, [firebaseUid]);

  const fetchSummaries = async () => {
    if (!firebaseUid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/youtube/user/${firebaseUid}/history`);
      const data = await response.json();
      if (data.success) {
        setSummaries(data.data.videos);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
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

  const truncateTitle = (title, maxLength = 80) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const filteredSummaries = summaries
    .filter(summary => 
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.channel.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'channel':
          return a.channel.localeCompare(b.channel);
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
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl">
                <Youtube className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">All YouTube Summaries</h1>
                <p className="text-gray-400">Your complete video summary history</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search summaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:outline-none appearance-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">By Title</option>
                  <option value="channel">By Channel</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              <span className="ml-3 text-gray-400">Loading summaries...</span>
            </div>
          ) : filteredSummaries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredSummaries.map((summary, index) => (
                <motion.div
                  key={summary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 hover:bg-gray-800/70 transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-red-500/20 p-3 rounded-lg shrink-0 group-hover:bg-red-500/30 transition-colors">
                      <Play className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors mb-2 line-clamp-2">
                        {truncateTitle(summary.title)}
                      </h3>
                      <div className="space-y-2 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span className="truncate">{summary.channel}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>{summary.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(summary.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/summary/${summary.id}`)}
                      className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Summary
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(summary.url, '_blank')}
                      className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 p-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full inline-block">
                      ✓ Summarized
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">
                {searchTerm ? 'No summaries found' : 'No summaries yet'}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Summarize your first YouTube video to get started'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/youtube')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Start Summarizing
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllSummaries;
