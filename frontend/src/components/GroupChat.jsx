import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, User, Circle } from 'lucide-react';

const GroupChat = ({ group, messages, onSendMessage, currentUserId, members = [] }) => {
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      if (typeof window !== 'undefined' && window.socket) {
        window.socket.emit('typing', {
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
      if (typeof window !== 'undefined' && window.socket) {
        window.socket.emit('typing', {
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
    if (typeof window !== 'undefined' && window.socket) {
      const socket = window.socket;

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
    }
  }, [group._id, currentUserId]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (typeof window !== 'undefined' && window.socket) {
      window.socket.emit('typing', {
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              const sender = getMessageSender(message.sender);
              const isCurrentUser = message.sender === currentUserId || sender?.firebaseUid === currentUserId;
              const showAvatar = !isCurrentUser && (idx === 0 || messages[idx - 1].sender !== message.sender);
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other users */}
                  {!isCurrentUser && (
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
                    {!isCurrentUser && showAvatar && (
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
