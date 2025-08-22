import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Globe,
  X,
  Play,
  BookOpen,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

// 3D Tiltable Comet Card Component
const CometCard = ({ children, onClick }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const cardRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Mouse position relative to card center
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation based on mouse position (max 15 degrees)
    const rotateY = (mouseX / (rect.width / 2)) * 15;
    const rotateX = -(mouseY / (rect.height / 2)) * 15;
    
    // Set mouse position for comet effect
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    
    // Apply 3D transform
    setTransform({
      rotateX,
      rotateY,
      scale: 1.05
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset transform smoothly
    setTransform({
      rotateX: 0,
      rotateY: 0,
      scale: 1
    });
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-black to-gray-900 border border-[#74AA9C]/20 cursor-pointer group shadow-lg shadow-[#74AA9C]/5"
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transition: isHovered 
          ? 'transform 0.1s ease-out' 
          : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {/* Enhanced Comet Trail Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(116, 170, 156, 0.2), rgba(116, 170, 156, 0.1) 30%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Shimmer Effect */}
      <div 
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        style={{
          transform: `translateZ(10px)` // Slightly lift shimmer effect
        }}
      />
      
      {/* Content with subtle 3D depth */}
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
      
      {/* Subtle shadow overlay for depth */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/5 via-transparent to-black/10 transition-opacity duration-300"
          style={{ transform: 'translateZ(5px)' }}
        />
      )}
    </motion.div>
  );
};

// Study Board Detail Modal
const StudyBoardModal = ({ board, isOpen, onClose, onLikeDislike, userInteraction }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-black via-black to-gray-900 rounded-2xl border border-[#74AA9C]/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg shadow-[#74AA9C]/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#74AA9C] to-[#74AA9C]/80 p-3 rounded-xl">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{board.studyBoardName}</h2>
                <p className="text-gray-400 text-sm">Study Board Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Video Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Youtube className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">Source Video</h3>
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">{board.videoTitle}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{board.videoChannel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{board.videoDuration}</span>
                  </div>
                </div>
                {board.videoUrl && (
                  <a
                    href={board.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors mt-2"
                  >
                    <Play className="w-4 h-4" />
                    Watch Video
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Creator Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Created By</h3>
              </div>
              <div className="flex items-center gap-3">
                {board.creator?.photoURL ? (
                  <img 
                    src={board.creator.photoURL} 
                    alt="Creator" 
                    className="w-12 h-12 rounded-full ring-2 ring-gray-600" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{board.creator?.displayName || 'Anonymous'}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Created on {new Date(board.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold text-white">Community Feedback</h3>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => onLikeDislike(board.id, 'like')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    userInteraction?.liked
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10 border border-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="font-medium">{board.likeCount}</span>
                  <span className="text-xs">Likes</span>
                </button>

                <button
                  onClick={() => onLikeDislike(board.id, 'dislike')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    userInteraction?.disliked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="font-medium">{board.dislikeCount}</span>
                  <span className="text-xs">Dislikes</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Navigate to study board
                  window.location.href = `/studyboard/${board.id}`;
                }}
                className="flex-1 bg-gradient-to-r from-[#74AA9C] to-[#74AA9C]/80 hover:from-[#74AA9C]/90 hover:to-[#74AA9C]/70 px-6 py-3 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Open Study Board
              </motion.button>
              
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

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
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCardClick = (board) => {
    setSelectedBoard(board);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBoard(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-[#74AA9C] to-[#74AA9C]/80 p-3 rounded-xl">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[#74AA9C]/80 bg-clip-text text-transparent">
                  Public Study Boards
                </h1>
                <p className="text-gray-400 text-lg">Discover and explore study materials shared by the community</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-br from-black via-black to-gray-900 rounded-2xl p-6 border border-[#74AA9C]/20 mb-8 backdrop-blur-sm shadow-lg shadow-[#74AA9C]/5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#74AA9C] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search study boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-[#74AA9C]/20 rounded-xl text-white placeholder-gray-400 focus:ring-[#74AA9C]/30 focus:border-[#74AA9C]/30 focus:outline-none backdrop-blur-sm transition-all"
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
                  className="bg-black/50 border border-[#74AA9C]/20 rounded-xl px-4 py-3 text-white focus:ring-[#74AA9C]/30 focus:border-[#74AA9C]/30 focus:outline-none backdrop-blur-sm"
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
            <div className="bg-red-900/20 border border-red-500 rounded-2xl p-6 text-center">
              <div className="text-red-400 mb-2">❌ {error}</div>
              <button
                onClick={() => fetchPublicStudyBoards()}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-white transition-colors"
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
                      >
                        <CometCard onClick={() => handleCardClick(board)}>
                          <div className="p-6" style={{ transform: 'translateZ(0)' }}>
                            {/* Thumbnail Section with enhanced 3D depth */}
                            <div 
                              className="relative mb-4 aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700/30"
                              style={{ transform: 'translateZ(30px)' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div 
                                  className="bg-black/50 backdrop-blur-sm rounded-full p-3 border border-gray-600/50 transition-transform duration-300 group-hover:scale-110"
                                  style={{ transform: 'translateZ(40px)' }}
                                >
                                  <BrainCircuit className="w-8 h-8 text-purple-400" />
                                </div>
                              </div>
                              <div 
                                className="absolute top-3 right-3 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-500/30"
                                style={{ transform: 'translateZ(20px)' }}
                              >
                                <Youtube className="w-4 h-4 text-red-400" />
                              </div>
                            </div>

                            {/* Content with layered 3D effect */}
                            <div className="space-y-3" style={{ transform: 'translateZ(10px)' }}>
                              <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-purple-100 transition-colors duration-300">
                                {board.studyBoardName}
                              </h3>
                              
                              <div className="text-sm text-gray-400 line-clamp-1 group-hover:text-gray-300 transition-colors duration-300">
                                {board.videoTitle}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(board.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{board.videoDuration}</span>
                                </div>
                              </div>

                              {/* Creator with enhanced hover effect */}
                              <div className="flex items-center gap-2">
                                <div style={{ transform: 'translateZ(15px)' }}>
                                  {board.creator?.photoURL ? (
                                    <img 
                                      src={board.creator.photoURL} 
                                      alt="Creator" 
                                      className="w-6 h-6 rounded-full ring-1 ring-gray-600 group-hover:ring-purple-500/50 transition-all duration-300" 
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                                      <User className="w-3 h-3 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
                                  {board.creator?.displayName || 'Anonymous'}
                                </span>
                              </div>

                              {/* Actions with floating effect */}
                              <div 
                                className="flex items-center justify-between pt-2 border-t border-gray-700/30 group-hover:border-gray-600/50 transition-colors duration-300"
                                style={{ transform: 'translateZ(5px)' }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-green-400 group-hover:text-green-300 transition-colors duration-300">
                                    <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                    <span className="text-sm font-medium">{board.likeCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-red-400 group-hover:text-red-300 transition-colors duration-300">
                                    <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                    <span className="text-sm font-medium">{board.dislikeCount}</span>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-purple-400 transition-colors duration-300">
                                  <Eye className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                                  Click to view
                                </div>
                              </div>
                            </div>
                          </div>
                        </CometCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 disabled:from-gray-800 disabled:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white transition-all border border-gray-700/50"
                  >
                    Previous
                  </motion.button>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <span className="text-gray-400">Page</span>
                    <span className="text-white font-medium">{page}</span>
                    <span className="text-gray-400">of</span>
                    <span className="text-white font-medium">{totalPages}</span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 disabled:from-gray-800 disabled:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white transition-all border border-gray-700/50"
                  >
                    Next
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Study Board Detail Modal */}
      {selectedBoard && (
        <StudyBoardModal
          board={selectedBoard}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onLikeDislike={handleLikeDislike}
          userInteraction={userInteractions[selectedBoard.id]}
        />
      )}
    </div>
  );
};

export default PublicStudyboard;