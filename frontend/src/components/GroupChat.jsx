import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, User, Circle, BrainCircuit, ExternalLink, Play, Clock, Youtube, Pin, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const GroupChat = ({ group, messages, onSendMessage, currentUserId, members = [] }) => {
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(true);
  const [teamStudyBoards, setTeamStudyBoards] = useState([]);
  const [showTeamStudyBoards, setShowTeamStudyBoards] = useState(true);
  const [loadingStudyBoards, setLoadingStudyBoards] = useState(false);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  // Get current user info
  const getCurrentUser = () => {
    return members.find(member => member._id === currentUserId) || members.find(member => member.firebaseUid === currentUserId);
  };

  // Get message sender info
  const getMessageSender = (senderId) => {
    return members.find(member => member._id === senderId) || members.find(member => member.firebaseUid === senderId);
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setChatInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing start event
      if (socket) {
        socket.emit('typing', {
          groupId: group._id,
          userId: currentUserId,
          userName: getCurrentUser()?.displayName || 'Unknown User',
          isTyping: true
        });
      }
    }
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', {
          groupId: group._id,
          userId: currentUserId,
          userName: getCurrentUser()?.displayName || 'Unknown User',
          isTyping: false
        });
      }
    }, 1000);
  };

  // Socket event listeners for typing
  useEffect(() => {
    const handleTyping = ({ groupId, userId, userName, isTyping: userIsTyping }) => {
      if (groupId === group._id && userId !== currentUserId) {
        setTypingUsers(prev => {
          if (userIsTyping) {
            return prev.includes(userName) ? prev : [...prev, userName];
          } else {
            return prev.filter(name => name !== userName);
          }
        });
      }
    };

      if (!socket) return;
      const handleUserOnline = ({ groupId, userId, userName, isOnline }) => {
        if (groupId === group._id) {
          setOnlineUsers(prev => {
            if (isOnline) {
              return prev.includes(userId) ? prev : [...prev, userId];
            } else {
              return prev.filter(id => id !== userId);
            }
          });
        }
      };

      socket.on('userTyping', handleTyping);
      socket.on('userOnlineStatus', handleUserOnline);

      return () => {
        socket.off('userTyping', handleTyping);
        socket.off('userOnlineStatus', handleUserOnline);
      };
    }, [socket, group._id, currentUserId]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket) {
      socket.emit('typing', {
        groupId: group._id,
        userId: currentUserId,
        userName: getCurrentUser()?.displayName || 'Unknown User',
        isTyping: false
      });
    }
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (socket && group?._id) {
      socket.emit('joinGroup', group._id);
    }
  }, [socket, group?._id]);

  // Extract pinned messages from regular messages
  useEffect(() => {
    const pinned = messages.filter(msg => 
      msg.isPinned && 
      msg.messageType === 'studyboard_share' && 
      msg.isSystemMessage
    );
    
    console.log('📌 PINNED MESSAGES UPDATE:', {
      groupId: group?._id,
      groupName: group?.name,
      totalMessages: messages.length,
      pinnedCount: pinned.length,
      pinnedMessages: pinned.map(msg => ({
        messageType: msg.messageType,
        isPinned: msg.isPinned,
        isSystemMessage: msg.isSystemMessage,
        content: msg.content ? JSON.parse(msg.content)?.studyBoardName : 'No content'
      }))
    });
    
    setPinnedMessages(pinned);
  }, [messages, group]);

  // Fetch study boards for the current team/group
  const fetchTeamStudyBoards = async () => {
    if (!group?._id) return;
    
    setLoadingStudyBoards(true);
    try {
      console.log('📚 FETCHING STUDY BOARDS FOR GROUP:', {
        groupId: group._id,
        groupName: group.name
      });
      
      const response = await fetch(`http://localhost:5000/api/studyboard-yt/group/${group._id}`);
      
      console.log('📚 RESPONSE STATUS:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📚 Study boards endpoint not found (404)');
          setTeamStudyBoards([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📚 RESPONSE DATA:', data);
      
      if (data.success) {
        const studyBoards = Array.isArray(data.data) ? data.data : [];
        setTeamStudyBoards(studyBoards);
        console.log('📚 SET TEAM STUDY BOARDS:', {
          groupId: group._id,
          groupName: group.name,
          count: studyBoards.length,
          studyBoards: studyBoards.map(sb => ({
            id: sb._id,
            name: sb.studyBoardName,
            videoTitle: sb.videoTitle
          }))
        });
      } else {
        console.log('📚 API returned unsuccessful response:', data);
        setTeamStudyBoards([]);
      }
    } catch (error) {
      console.error('❌ Error fetching team study boards:', error);
      setTeamStudyBoards([]);
    } finally {
      setLoadingStudyBoards(false);
    }
  };

  // Fetch team study boards when group changes
  useEffect(() => {
    fetchTeamStudyBoards();
  }, [group?._id]);

  // Handle study board message click
  const handleStudyBoardClick = (studyBoardId) => {
    console.log('🔗 NAVIGATING TO STUDY BOARD:', studyBoardId);
    navigate(`/studyboard/${studyBoardId}`);
  };

  // Render study board share message
  const renderStudyBoardMessage = (messageContent, isPinned = false) => {
    try {
      const content = JSON.parse(messageContent);
      console.log('🎨 RENDERING STUDY BOARD MESSAGE:', {
        type: content.type,
        studyBoardId: content.studyBoardId,
        studyBoardName: content.studyBoardName,
        isPinned
      });
      
      return (
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStudyBoardClick(content.studyBoardId)}
          className={`${
            isPinned 
              ? 'bg-gradient-to-br from-[#74AA9C]/20 to-[#74AA9C]/10 border-2 border-[#74AA9C]/60 shadow-lg shadow-[#74AA9C]/20' 
              : 'bg-gradient-to-br from-[#74AA9C]/15 to-[#74AA9C]/5 border border-[#74AA9C]/40 hover:border-[#74AA9C]/60'
          } rounded-xl p-4 cursor-pointer hover:shadow-lg hover:shadow-[#74AA9C]/10 transition-all duration-300 backdrop-blur-sm`}
        >
          <div className="flex items-start gap-3">
            <div className={`${isPinned ? 'bg-[#74AA9C]/30' : 'bg-[#74AA9C]/20'} p-3 rounded-lg shrink-0 shadow-sm`}>
              <BrainCircuit className="w-5 h-5 text-[#74AA9C]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                {isPinned && <Pin className="w-4 h-4 text-[#74AA9C]" />}
                <span className="text-[#74AA9C] font-semibold text-sm">
                  📚 Study Board {isPinned ? '(Pinned)' : 'Shared'}
                </span>
                <ExternalLink className="w-3 h-3 text-[#74AA9C]" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-3 line-clamp-1">
                {content.studyBoardName}
              </h4>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-gray-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span className="text-gray-200 text-xs font-medium line-clamp-1">
                    {content.videoTitle}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{content.videoChannel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{content.videoDuration}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {content.sharedByPhoto && (
                    <img src={content.sharedByPhoto} alt="User" className="w-5 h-5 rounded-full border-2 border-[#74AA9C]/30" />
                  )}
                  <span className="text-xs text-gray-400">
                    Shared by {content.sharedBy}
                  </span>
                </div>
                <span className="text-xs text-[#74AA9C] font-semibold px-2 py-1 bg-[#74AA9C]/10 rounded-md">
                  Click to view →
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      );
    } catch (e) {
      console.error('❌ Error parsing study board message content:', e, messageContent);
      return <span className="text-sm text-white">{messageContent}</span>;
    }
    return <span className="text-sm text-white">{messageContent}</span>;
  };

  // Render team study board item
  const renderTeamStudyBoard = (studyBoard) => {
    return (
      <motion.div
        key={studyBoard._id}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleStudyBoardClick(studyBoard._id)}
        className="bg-gradient-to-br from-[#74AA9C]/15 to-[#74AA9C]/5 border border-[#74AA9C]/40 rounded-xl p-4 cursor-pointer hover:border-[#74AA9C]/60 hover:shadow-lg hover:shadow-[#74AA9C]/10 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="flex items-start gap-3">
          <div className="bg-[#74AA9C]/20 p-3 rounded-lg shrink-0 shadow-sm">
            <BookOpen className="w-4 h-4 text-[#74AA9C]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#74AA9C] font-semibold text-xs">
                📖 Team Study Board
              </span>
              <ExternalLink className="w-3 h-3 text-[#74AA9C]" />
            </div>
            <h4 className="text-white font-semibold text-sm mb-2 line-clamp-1">
              {studyBoard.studyBoardName || studyBoard.name || studyBoard.title || 'Untitled Study Board'}
            </h4>
            {studyBoard.videoTitle && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 mb-2 border border-gray-800/50">
                <div className="flex items-center gap-2">
                  <Youtube className="w-3 h-3 text-red-400" />
                  <span className="text-gray-200 text-xs line-clamp-1">
                    {studyBoard.videoTitle}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {studyBoard.userId?.photoURL && (
                  <img 
                    src={studyBoard.userId.photoURL} 
                    alt="Creator" 
                    className="w-4 h-4 rounded-full border-2 border-[#74AA9C]/30" 
                  />
                )}
                <span className="text-xs text-gray-400">
                  Created by {studyBoard.userId?.displayName || studyBoard.createdBy?.displayName || 'Unknown'}
                </span>
              </div>
              <span className="text-xs text-[#74AA9C] font-semibold px-2 py-1 bg-[#74AA9C]/10 rounded-md">
                View →
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Filter out pinned messages from regular chat flow
  const regularMessages = messages.filter(msg => !msg.isPinned);

  return (
    <div className="bg-black rounded-2xl border border-gray-800/50 shadow-2xl flex flex-col h-96 backdrop-blur-sm">
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-black/50 to-[#74AA9C]/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[#74AA9C]/20 rounded-lg">
                <MessageCircle className="w-6 h-6 text-[#74AA9C]" />
              </div>
              Group Chat
            </h3>
            <p className="text-gray-400 text-sm mt-1">Real-time messaging with group members</p>
          </div>
          
          {/* Online Members Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#74AA9C]/10 px-3 py-2 rounded-full border border-[#74AA9C]/30">
              <Circle className="w-2 h-2 text-[#74AA9C] fill-current animate-pulse" />
              <span className="text-white text-sm font-medium">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Study Boards Section */}
      {(teamStudyBoards.length > 0 || loadingStudyBoards) && (
        <div className="border-b border-gray-800/50 bg-gradient-to-r from-black/30 to-[#74AA9C]/5">
          <div className="p-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowTeamStudyBoards(!showTeamStudyBoards)}
              className="flex items-center justify-between w-full text-left hover:bg-[#74AA9C]/10 rounded-xl p-3 transition-all duration-300 border border-transparent hover:border-[#74AA9C]/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#74AA9C]/20 rounded-lg">
                  <BookOpen className="w-4 h-4 text-[#74AA9C]" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Team Study Boards {!loadingStudyBoards && `(${teamStudyBoards.length})`}
                </span>
                {loadingStudyBoards && (
                  <div className="w-4 h-4 border-2 border-[#74AA9C]/30 border-t-[#74AA9C] rounded-full animate-spin" />
                )}
              </div>
              <motion.div
                animate={{ rotate: showTeamStudyBoards ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-[#74AA9C]" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showTeamStudyBoards && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="mt-4"
                >
                  {loadingStudyBoards ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-3 border-[#74AA9C]/30 border-t-[#74AA9C] rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Loading study boards...</p>
                    </div>
                  ) : teamStudyBoards.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-[#74AA9C]/10 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[#74AA9C]" />
                      </div>
                      <p className="text-sm text-gray-400">No study boards created for this team yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {teamStudyBoards.map((studyBoard, idx) => (
                        <motion.div
                          key={studyBoard._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.3 }}
                        >
                          {renderTeamStudyBoard(studyBoard)}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pinned Study Boards Section */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-gray-800/50 bg-gradient-to-r from-black/30 to-[#74AA9C]/5">
          <div className="p-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowPinnedMessages(!showPinnedMessages)}
              className="flex items-center justify-between w-full text-left hover:bg-[#74AA9C]/10 rounded-xl p-3 transition-all duration-300 border border-transparent hover:border-[#74AA9C]/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#74AA9C]/20 rounded-lg">
                  <Pin className="w-4 h-4 text-[#74AA9C]" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Pinned Study Boards ({pinnedMessages.length})
                </span>
              </div>
              <motion.div
                animate={{ rotate: showPinnedMessages ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-[#74AA9C]" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showPinnedMessages && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="mt-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar"
                >
                  {pinnedMessages.map((message, idx) => (
                    <motion.div
                      key={`pinned-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                    >
                      {renderStudyBoardMessage(message.content, true)}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-black/20 to-black/40">
        {regularMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-[#74AA9C]/10 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-[#74AA9C]" />
            </div>
            <p className="text-gray-400 text-lg">
              {pinnedMessages.length > 0 
                ? "Check out the pinned study boards above! Start chatting about them."
                : "No messages yet. Start the conversation!"
              }
            </p>
          </div>
        ) : (
          <>
            {regularMessages.map((message, idx) => {
              const sender = getMessageSender(message.sender);
              const isCurrentUser = message.sender === currentUserId || sender?.firebaseUid === currentUserId;
              const isSystemMessage = message.isSystemMessage || message.sender === 'system';
              const showAvatar = !isCurrentUser && !isSystemMessage && (idx === 0 || regularMessages[idx - 1].sender !== message.sender);
              
              // Handle system messages (study board shares) - but only show non-pinned ones in chat flow
              if (isSystemMessage && message.messageType === 'studyboard_share' && !message.isPinned) {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="max-w-md w-full">
                      {renderStudyBoardMessage(message.content, false)}
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other users */}
                  {!isCurrentUser && !isSystemMessage && (
                    <div className="w-10 h-10 mr-3 flex-shrink-0">
                      {showAvatar && sender?.photoURL ? (
                        <img 
                          src={sender.photoURL} 
                          alt={sender.displayName || 'User'} 
                          className="w-10 h-10 rounded-full border-2 border-[#74AA9C]/30 shadow-lg"
                        />
                      ) : showAvatar ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#74AA9C]/20 to-[#74AA9C]/10 border-2 border-[#74AA9C]/30 flex items-center justify-center shadow-lg">
                          <User className="w-5 h-5 text-[#74AA9C]" />
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
                    {/* Sender name for other users */}
                    {!isCurrentUser && !isSystemMessage && showAvatar && (
                      <p className="text-xs text-gray-400 mb-2 ml-3 font-medium">
                        {sender?.displayName || 'Unknown User'}
                      </p>
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-[#74AA9C] to-[#74AA9C]/80 text-white rounded-br-md border border-[#74AA9C]/50'
                          : 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 text-white rounded-bl-md border border-gray-700/50'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 flex items-center gap-1 ${
                        isCurrentUser ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                        {isCurrentUser && (
                          <span className="ml-1 text-white/70">✓</span>
                        )}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md max-w-xs border border-gray-700/50 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#74AA9C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#74AA9C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#74AA9C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-xs text-gray-300 font-medium">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} are typing...`
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-800/50 bg-gradient-to-r from-black/50 to-[#74AA9C]/5 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#74AA9C]/50 focus:border-[#74AA9C]/50 focus:outline-none resize-none transition-all duration-300 backdrop-blur-sm shadow-inner"
              rows="1"
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(116, 170, 156, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!chatInput.trim()}
            className="bg-gradient-to-r from-[#74AA9C] to-[#74AA9C]/80 hover:from-[#74AA9C]/90 hover:to-[#74AA9C]/70 disabled:from-[#74AA9C]/50 disabled:to-[#74AA9C]/30 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 flex items-center gap-2 shadow-lg border border-[#74AA9C]/30"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(116, 170, 156, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(116, 170, 156, 0.5);
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default GroupChat;