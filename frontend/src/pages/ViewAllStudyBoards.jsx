import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  User,
  Clock,
  Search,
  Filter
} from 'lucide-react';

const ViewAllStudyBoards = () => {
  const { mongoUid } = useUser();
  const navigate = useNavigate();
  const [studyBoards, setStudyBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchStudyBoards();
  }, [mongoUid]);

  const fetchStudyBoards = async () => {
    if (!mongoUid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/studyboard-yt/user/${mongoUid}`);
      const data = await response.json();
      if (data.success) {
        setStudyBoards(data.data.studyBoards);
      }
    } catch (error) {
      console.error('Error fetching study boards:', error);
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

  const filteredStudyBoards = studyBoards
    .filter(board => 
      board.studyBoardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.videoTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.studyBoardName.localeCompare(b.studyBoardName);
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
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-xl">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">All Study Boards</h1>
                <p className="text-gray-400">Manage your AI-generated study materials</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search study boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none appearance-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">By Name</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span className="ml-3 text-gray-400">Loading study boards...</span>
            </div>
          ) : filteredStudyBoards.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredStudyBoards.map((board, index) => (
                <motion.div
                  key={board.id || board._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    const boardId = board._id || board.id || board.studyBoardId;
                    if (boardId) {
                      navigate(`/studyboard/${boardId}`);
                    }
                  }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-purple-500/20 p-3 rounded-lg shrink-0 group-hover:bg-purple-500/30 transition-colors">
                      <BrainCircuit className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                        {board.studyBoardName}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                        {board.videoTitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span className="truncate">{board.videoChannel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(board.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="text-xs text-purple-400 font-medium">
                      Click to view study materials →
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">
                {searchTerm ? 'No study boards found' : 'No study boards yet'}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first study board from a YouTube video'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/youtube')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create Study Board
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllStudyBoards;
