import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
import { 
  BrainCircuit, 
  Youtube, 
  Calendar, 
  User,
  Loader2,
  ExternalLink,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Filter,
  Search,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const PublicStudyboard = () => {
  const { mongoUid } = useUser();
  const navigate = useNavigate();
  const [studyBoards, setStudyBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [userInteractions, setUserInteractions] = useState({});

  const SORT_OPTIONS = [
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'oldest', label: '📅 Oldest First' },
    { value: 'most_liked', label: '❤️ Most Liked' }
  ];

  useEffect(() => {
    fetchPublicStudyBoards();
  }, [page, sortBy]);

  const fetchPublicStudyBoards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/studyboard-yt/public?page=${page}&limit=12&sortBy=${sortBy}`);
      const data = await response.json();
      
      if (data.success) {
        setStudyBoards(data.data.studyBoards);
        setTotalPages(data.data.pagination.totalPages);
        
        // Initialize user interactions
        const interactions = {};
        data.data.studyBoards.forEach(board => {
          interactions[board.id] = {
            liked: board.likes?.includes(mongoUid),
            disliked: board.dislikes?.includes(mongoUid)
          };
        });
        setUserInteractions(interactions);
      } else {
        setError(data.error || 'Failed to fetch study boards');
      }
    } catch (error) {
      console.error('Error fetching public study boards:', error);
      setError('Failed to fetch study boards');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeDislike = async (boardId, action) => {
    if (!mongoUid) {
      toast.error('Please log in to like/dislike study boards');
      return;
    }

    try {
      const currentInteraction = userInteractions[boardId];
      const isCurrentAction = currentInteraction?.[action === 'like' ? 'liked' : 'disliked'];
      
      let response;
      if (isCurrentAction) {
        // Remove the current action
        response = await fetch(`http://localhost:5000/api/studyboard-yt/${boardId}/like-dislike`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: mongoUid })
        });
      } else {
        // Add or change the action
        response = await fetch(`http://localhost:5000/api/studyboard-yt/${boardId}/like-dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: mongoUid, action })
        });
      }

      const data = await response.json();
      
      if (data.success) {
        // Update study boards with new counts
        setStudyBoards(prev => prev.map(board => 
          board.id === boardId 
            ? { ...board, likeCount: data.data.likeCount, dislikeCount: data.data.dislikeCount }
            : board
        ));

        // Update user interactions
        setUserInteractions(prev => ({
          ...prev,
          [boardId]: {
            liked: data.data.userAction === 'like',
            disliked: data.data.userAction === 'dislike'
          }
        }));

        const actionText = isCurrentAction ? 'removed' : (action === 'like' ? 'liked' : 'disliked');
        toast.success(`Study board ${actionText}!`);
      } else {
        toast.error(data.error || 'Failed to update reaction');
      }
    } catch (error) {
      console.error('Error updating like/dislike:', error);
      toast.error('Failed to update reaction');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateTitle = (title, maxLength = 60) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const filteredStudyBoards = studyBoards.filter(board =>
    board.studyBoardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.videoChannel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Public Study Boards</h1>
                <p className="text-gray-400 text-lg">Discover and explore study materials shared by the community</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search study boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none"
                />
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Sort by:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mr-3" />
              <span className="text-gray-400 text-lg">Loading study boards...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 text-center">
              <div className="text-red-400 mb-2">❌ {error}</div>
              <button
                onClick={() => fetchPublicStudyBoards()}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Study Boards Grid */}
          {!loading && !error && (
            <>
              {filteredStudyBoards.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No study boards found</h3>
                  <p className="text-gray-500">Try adjusting your search or check back later</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {filteredStudyBoards.map((board, index) => {
                    const userInteraction = userInteractions[board.id] || {};
                    
                    return (
                      <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/30 transition-all duration-200 group"
                      >
                        {/* Study Board Header */}
                        <div className="p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="bg-purple-500/20 p-2 rounded-lg shrink-0">
                              <BrainCircuit className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                                {truncateTitle(board.studyBoardName, 50)}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(board.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Video Info */}
                          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Youtube className="w-4 h-4 text-red-400" />
                              <span className="text-white text-sm font-medium line-clamp-1">
                                {truncateTitle(board.videoTitle, 40)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{board.videoChannel}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{board.videoDuration}</span>
                              </div>
                            </div>
                          </div>

                          {/* Creator Info */}
                          <div className="flex items-center gap-2 mb-4">
                            {board.creator?.photoURL ? (
                              <img 
                                src={board.creator.photoURL} 
                                alt="Creator" 
                                className="w-6 h-6 rounded-full" 
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-300" />
                              </div>
                            )}
                            <span className="text-sm text-gray-400">
                              by {board.creator?.displayName || 'Anonymous'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Like Button */}
                              <button
                                onClick={() => handleLikeDislike(board.id, 'like')}
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                  userInteraction.liked
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm">{board.likeCount}</span>
                              </button>

                              {/* Dislike Button */}
                              <button
                                onClick={() => handleLikeDislike(board.id, 'dislike')}
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                  userInteraction.disliked
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span className="text-sm">{board.dislikeCount}</span>
                              </button>
                            </div>

                            {/* View Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/studyboard/${board.id}`)}
                              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-white transition-colors flex items-center gap-2 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicStudyboard;
