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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStudyBoardClick(content.studyBoardId)}
          className={`${
            isPinned 
              ? 'bg-gradient-to-r from-purple-700/30 to-indigo-700/30 border-2 border-purple-500/50' 
              : 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30'
          } rounded-lg p-4 cursor-pointer hover:border-purple-400/50 transition-all`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-purple-500/30 p-2 rounded-lg shrink-0">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isPinned && <Pin className="w-4 h-4 text-purple-400" />}
                <span className="text-purple-400 font-medium text-sm">
                  📚 Study Board {isPinned ? '(Pinned)' : 'Shared'}
                </span>
                <ExternalLink className="w-3 h-3 text-purple-400" />
              </div>
              <h4 className="text-white font-medium text-sm mb-2 line-clamp-1">
                {content.studyBoardName}
              </h4>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300 text-xs font-medium line-clamp-1">
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
                    <img src={content.sharedByPhoto} alt="User" className="w-4 h-4 rounded-full" />
                  )}
                  <span className="text-xs text-gray-400">
                    Shared by {content.sharedBy}
                  </span>
                </div>
                <span className="text-xs text-purple-400 font-medium">
                  Click to view →
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      );
    } catch (e) {
      console.error('❌ Error parsing study board message content:', e, messageContent);
      return <span className="text-sm">{messageContent}</span>;
    }
    return <span className="text-sm">{messageContent}</span>;
  };

  // Render team study board item
  const renderTeamStudyBoard = (studyBoard) => {
    return (
      <motion.div
        key={studyBoard._id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleStudyBoardClick(studyBoard._id)}
        className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-3 cursor-pointer hover:border-blue-400/50 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="bg-blue-500/30 p-2 rounded-lg shrink-0">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 font-medium text-xs">
                📖 Team Study Board
              </span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </div>
            <h4 className="text-white font-medium text-sm mb-2 line-clamp-1">
              {studyBoard.studyBoardName || studyBoard.name || studyBoard.title || 'Untitled Study Board'}
            </h4>
            {studyBoard.videoTitle && (
              <div className="bg-gray-800/50 rounded-lg p-2 mb-2">
                <div className="flex items-center gap-2">
                  <Youtube className="w-3 h-3 text-red-400" />
                  <span className="text-gray-300 text-xs line-clamp-1">
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
                    className="w-4 h-4 rounded-full" 
                  />
                )}
                <span className="text-xs text-gray-400">
                  Created by {studyBoard.userId?.displayName || studyBoard.createdBy?.displayName || 'Unknown'}
                </span>
              </div>
              <span className="text-xs text-blue-400 font-medium">
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
    <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-96">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              Group Chat
            </h3>
            <p className="text-gray-400 text-sm">Real-time messaging with group members</p>
          </div>
          
          {/* Online Members Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 text-green-400 fill-current" />
              <span className="text-gray-400 text-sm">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Study Boards Section */}
      {(teamStudyBoards.length > 0 || loadingStudyBoards) && (
        <div className="border-b border-gray-700 bg-gray-900/50">
          <div className="p-3">
            <button
              onClick={() => setShowTeamStudyBoards(!showTeamStudyBoards)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  Team Study Boards {!loadingStudyBoards && `(${teamStudyBoards.length})`}
                </span>
                {loadingStudyBoards && (
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                )}
              </div>
              {showTeamStudyBoards ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {showTeamStudyBoards && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  {loadingStudyBoards ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Loading study boards...</p>
                    </div>
                  ) : teamStudyBoards.length === 0 ? (
                    <div className="text-center py-4">
                      <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No study boards created for this team yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamStudyBoards.map((studyBoard, idx) => (
                        <motion.div
                          key={studyBoard._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
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
        <div className="border-b border-gray-700 bg-gray-900/50">
          <div className="p-3">
            <button
              onClick={() => setShowPinnedMessages(!showPinnedMessages)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">
                  Pinned Study Boards ({pinnedMessages.length})
                </span>
              </div>
              {showPinnedMessages ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {showPinnedMessages && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 max-h-48 overflow-y-auto"
                >
                  {pinnedMessages.map((message, idx) => (
                    <motion.div
                      key={`pinned-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {regularMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-4"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other users */}
                  {!isCurrentUser && !isSystemMessage && (
                    <div className="w-8 h-8 mr-2 flex-shrink-0">
                      {showAvatar && sender?.photoURL ? (
                        <img 
                          src={sender.photoURL} 
                          alt={sender.displayName || 'User'} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-8' : 'mr-8'}`}>
                    {/* Sender name for other users */}
                    {!isCurrentUser && !isSystemMessage && showAvatar && (
                      <p className="text-xs text-gray-400 mb-1 ml-2">
                        {sender?.displayName || 'Unknown User'}
                      </p>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                        {isCurrentUser && (
                          <span className="ml-1">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-700 px-4 py-2 rounded-lg max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-xs text-gray-400">
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
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none resize-none"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '100px' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!chatInput.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
