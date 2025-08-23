import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle, Send, Loader2, User, Bot, Clock, 
  AlertCircle, CheckCircle, Trash2, Plus, Youtube,
  BrainCircuit, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';

const YTFollowUp = ({ preloadedData, videoData, isPreloaded = false }) => {
  const { mongoUid, firebaseUid } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(preloadedData?.sessionData || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (mongoUid) {
      loadUserSessions();
    }
  }, [mongoUid]);

  // If videoData is passed from parent, use it to create session
  useEffect(() => {
    if (videoData && mongoUid && !currentSession) {
      createChatSession(videoData.video.url, videoData.video.title, videoData.video.channel);
    }
  }, [videoData, mongoUid]);

  // Update session when preloadedData changes
  useEffect(() => {
    if (preloadedData?.sessionData) {
      setCurrentSession(preloadedData.sessionData);
      // Load chat history instead of clearing messages
      loadChatHistory(preloadedData.sessionData.sessionId);
      loadUserSessions();
    }
  }, [preloadedData]);

  const loadUserSessions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/youtube/chat/user/${mongoUid}/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createChatSession = async (videoUrl, title = null, channel = null) => {
    if (!videoUrl) {
      toast.error('Please provide a video URL');
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (!mongoUid) {
      toast.error('Please log in to use this feature');
      return;
    }

    setSessionLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/youtube/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mongoUid,
          videoUrl: videoUrl.trim(),
          videoTitle: title,
          videoChannel: channel
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentSession(data.data);
        setMessages([]);
        toast.success('Chat session created!');
        loadUserSessions();
        
        // Clear URL input if it was used
        if (!videoData) {
          setUrl('');
        }
      } else {
        setError(data.error || 'Failed to create chat session');
        toast.error(data.error || 'Failed to create chat session');
      }
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Cannot connect to server. Please make sure the backend is running.' 
        : err.message || 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    await createChatSession(url);
  };

  // Helper function to normalize messages from backend format to frontend format
  const normalizeMessages = (msgs) => {
    if (!Array.isArray(msgs)) return [];
    return msgs.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.message || m.content,
      timestamp: m.timestamp
    }));
  };

  const loadChatHistory = async (sessionId) => {
    try {
      setLoading(true);
      console.log('Loading chat history for session:', sessionId);
      const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${sessionId}`);
      const data = await response.json();

      console.log('Chat history response:', data);

      if (data.success) {
        setCurrentSession(data.data.session);
        const messagesArray = data.data.messages || [];
        console.log('Raw messages from backend:', messagesArray);
        
        const normalizedMessages = normalizeMessages(messagesArray);
        console.log('Normalized messages for frontend:', normalizedMessages);
        
        setMessages(normalizedMessages);
        setError(null);
      } else {
        console.error('Failed to load chat history:', data.error);
        toast.error('Failed to load chat history');
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentSession) {
      return;
    }

    const userMessage = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    // Add user message to UI immediately
    const tempUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${currentSession.sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage
        }),
      });

      const data = await response.json();
      console.log('Send message response:', data);

      if (response.ok && data.success) {
        // Add AI response to messages - handle both possible response formats
        const aiMessage = {
          role: 'assistant',
          content: data.data.aiResponse || data.data.message,
          timestamp: data.data.timestamp || new Date().toISOString()
        };
        console.log('Adding AI message:', aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast.error(data.error || 'Failed to send message');
        // Remove the temporary user message if failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove the temporary user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Chat session deleted');
        if (currentSession?.sessionId === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
        loadUserSessions();
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setError(null);
  };

  const renderChatHeader = () => (
    <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-black to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{currentSession.videoTitle}</h3>
          <p className="text-gray-400 text-sm">{currentSession.videoChannel}</p>
        </div>
        <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full border border-[#74AA9C]/20">
          <CheckCircle className="w-5 h-5 text-[#74AA9C]" />
          <span className="text-[#74AA9C] text-sm font-medium">Chat Ready</span>
        </div>
      </div>
    </div>
  );

  const renderMessagesArea = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-black to-gray-900">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-lg">
            <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] p-6 rounded-3xl mb-6 inline-block shadow-2xl">
              <MessageCircle className="w-16 h-16 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-3">Ready to Chat!</h4>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Ask anything about this video! I have access to the transcript and summary to help answer your questions.
            </p>
            <div className="space-y-3 max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNewMessage("What are the main points covered in this video?")}
                className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 hover:border-[#74AA9C]/50 text-gray-300 hover:text-white px-6 py-4 rounded-xl transition-all duration-300 text-sm shadow-lg backdrop-blur-sm"
              >
                "What are the main points covered in this video?"
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNewMessage("Can you explain the most important concept?")}
                className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 hover:border-[#74AA9C]/50 text-gray-300 hover:text-white px-6 py-4 rounded-xl transition-all duration-300 text-sm shadow-lg backdrop-blur-sm"
              >
                "Can you explain the most important concept?"
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNewMessage("What should I remember from this video?")}
                className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 hover:border-[#74AA9C]/50 text-gray-300 hover:text-white px-6 py-4 rounded-xl transition-all duration-300 text-sm shadow-lg backdrop-blur-sm"
              >
                "What should I remember from this video?"
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-4 max-w-[85%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-3 rounded-2xl shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] ring-2 ring-[#74AA9C]/20' 
                    : 'bg-gradient-to-br from-gray-800 to-gray-900 ring-2 ring-gray-700/50'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-[#74AA9C]" />
                  )}
                </div>
                <div className={`p-5 rounded-3xl shadow-xl backdrop-blur-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] text-white ring-2 ring-[#74AA9C]/30'
                    : 'bg-gradient-to-br from-gray-900 to-black text-gray-100 border border-gray-700/50 ring-2 ring-gray-800/50'
                }`}>
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="text-gray-100 mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({children}) => <strong className="font-semibold text-[#74AA9C]">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-black/50 text-[#74AA9C] px-2 py-1 rounded-lg text-sm border border-gray-700">{children}</code>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-100 space-y-2 ml-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-100 space-y-2 ml-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-100">{children}</li>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-600/30">
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {sendingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 ring-2 ring-gray-700/50 p-3 rounded-2xl shadow-lg">
                  <Bot className="w-5 h-5 text-[#74AA9C]" />
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700/50 ring-2 ring-gray-800/50 p-5 rounded-3xl shadow-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#74AA9C]" />
                    <span className="text-gray-300 font-medium">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );

  const renderMessageInput = () => (
    <div className="p-6 border-t border-gray-800 bg-gradient-to-r from-black to-gray-900">
      <form onSubmit={sendMessage} className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask a question about this video..."
            className="w-full px-6 py-4 bg-black border-2 border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#74AA9C] focus:ring-4 focus:ring-[#74AA9C]/20 transition-all duration-300 shadow-lg backdrop-blur-sm"
            disabled={sendingMessage}
          />
        </div>
        <motion.button
          type="submit"
          disabled={sendingMessage || !newMessage.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] hover:from-[#85bbac] hover:to-[#6b9b8b] disabled:from-gray-700 disabled:to-gray-800 text-white p-4 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg ring-2 ring-[#74AA9C]/30 disabled:ring-gray-700/30"
        >
          <Send className="w-6 h-6" />
        </motion.button>
      </form>
    </div>
  );

  if (isPreloaded && currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74AA9C] to-white">
                Follow-up Chat
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Ask questions about the video content with AI</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sessions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-gray-800 shadow-2xl backdrop-blur-sm ring-2 ring-gray-800/50 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startNewChat}
                    className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] hover:from-[#85bbac] hover:to-[#6b9b8b] text-white p-3 rounded-xl transition-all duration-300 shadow-lg ring-2 ring-[#74AA9C]/30"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No chat sessions yet</p>
                  ) : (
                    sessions.map((session) => (
                      <motion.div
                        key={session.sessionId}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm ${
                          currentSession?.sessionId === session.sessionId
                            ? 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] border-[#74AA9C] text-white ring-2 ring-[#74AA9C]/30'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-gray-300 hover:border-[#74AA9C]/50 hover:ring-2 hover:ring-[#74AA9C]/20'
                        }`}
                        onClick={() => loadChatHistory(session.sessionId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate mb-1">
                              {session.videoTitle}
                            </p>
                            <p className="text-xs opacity-70 truncate mb-2">
                              {session.videoChannel}
                            </p>
                            <div className="flex items-center text-xs opacity-60">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {session.messageCount} messages
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.sessionId);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors ml-3 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )
                }
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm ring-2 ring-gray-800/50 h-[700px] flex flex-col overflow-hidden">
                {/* Chat Header */}
                {renderChatHeader()}

                {/* Messages Area */}
                {renderMessagesArea()}

                {/* Message Input */}
                {renderMessageInput()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return existing component code for non-preloaded use
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] p-6 rounded-3xl shadow-2xl ring-4 ring-[#74AA9C]/20">
              <MessageCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74AA9C] to-white">
              YouTube
            </span> Follow-up Chat
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Ask follow-up questions about any YouTube video. Get detailed answers based on the transcript and summary.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-gray-800 shadow-2xl backdrop-blur-sm ring-2 ring-gray-800/50 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewChat}
                  className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] hover:from-[#85bbac] hover:to-[#6b9b8b] text-white p-3 rounded-xl transition-all duration-300 shadow-lg ring-2 ring-[#74AA9C]/30"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No chat sessions yet</p>
                ) : (
                  sessions.map((session) => (
                    <motion.div
                      key={session.sessionId}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm ${
                        currentSession?.sessionId === session.sessionId
                          ? 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] border-[#74AA9C] text-white ring-2 ring-[#74AA9C]/30'
                          : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-gray-300 hover:border-[#74AA9C]/50 hover:ring-2 hover:ring-[#74AA9C]/20'
                      }`}
                      onClick={() => loadChatHistory(session.sessionId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate mb-1">
                            {session.videoTitle}
                          </p>
                          <p className="text-xs opacity-70 truncate mb-2">
                            {session.videoChannel}
                          </p>
                          <div className="flex items-center text-xs opacity-60">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {session.messageCount} messages
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.sessionId);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors ml-3 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
              )
          }
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {!currentSession ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-gray-800 shadow-2xl backdrop-blur-sm ring-2 ring-gray-800/50"
              >
                {!videoData && (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-8 text-center">
                      Start a New Chat Session
                    </h3>
                    
                    <form onSubmit={handleCreateSession} className="space-y-8">
                      <div className="space-y-4">
                        <label className="block text-xl font-semibold text-white mb-4">
                          YouTube Video URL
                        </label>
                        <div className="relative">
                          <Youtube className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#74AA9C] w-6 h-6" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full pl-16 pr-6 py-5 bg-black border-2 border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#74AA9C] focus:ring-4 focus:ring-[#74AA9C]/20 transition-all duration-300 text-lg shadow-lg backdrop-blur-sm"
                            disabled={sessionLoading}
                          />
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={sessionLoading}
                        whileHover={{ scale: sessionLoading ? 1 : 1.02 }}
                        whileTap={{ scale: sessionLoading ? 1 : 0.98 }}
                        className="w-full bg-gradient-to-r from-[#74AA9C] to-[#5a8a7a] hover:from-[#85bbac] hover:to-[#6b9b8b] disabled:from-gray-600 disabled:to-gray-700 text-white py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center space-x-4 shadow-2xl ring-4 ring-[#74AA9C]/30 disabled:ring-gray-700/30 disabled:cursor-not-allowed"
                      >
                        {sessionLoading ? (
                          <>
                            <Loader2 className="w-7 h-7 animate-spin" />
                            <span>Creating Chat Session...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-7 h-7" />
                            <span>Start Chat Session</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  </>
                )}

                {videoData && (
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] p-6 rounded-3xl inline-block mb-8 shadow-2xl ring-4 ring-[#74AA9C]/20">
                      <BrainCircuit className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">
                      Ready to Chat About This Video
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">
                      A chat session will be created automatically for the current video.
                    </p>
                    <div className="bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 mb-8 border border-gray-700 shadow-xl ring-2 ring-gray-800/50">
                      <p className="text-white font-semibold text-lg mb-2">{videoData.video.title}</p>
                      <p className="text-gray-400">{videoData.video.channel}</p>
                    </div>
                    <p className="text-gray-500 leading-relaxed">
                      The AI has access to the video's transcript and summary to answer your questions.
                    </p>
                  </div>
                )}

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 shadow-xl ring-2 ring-gray-800/50 backdrop-blur-sm"
                  >
                    <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-[#74AA9C]/20">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3 text-white">Interactive Chat</h4>
                    <p className="text-gray-400 leading-relaxed">Ask follow-up questions and get detailed answers</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 shadow-xl ring-2 ring-gray-800/50 backdrop-blur-sm"
                  >
                    <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-[#74AA9C]/20">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3 text-white">Context Aware</h4>
                    <p className="text-gray-400 leading-relaxed">AI understands the video content and context</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 shadow-xl ring-2 ring-gray-800/50 backdrop-blur-sm"
                  >
                    <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-[#74AA9C]/20">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3 text-white">Chat History</h4>
                    <p className="text-gray-400 leading-relaxed">All conversations are saved for future reference</p>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm ring-2 ring-gray-800/50 h-[700px] flex flex-col overflow-hidden">
                {/* Chat Header */}
                {renderChatHeader()}

                {/* Messages Area */}
                {renderMessagesArea()}

                {/* Message Input */}
                {renderMessageInput()}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm ring-4 ring-red-500/20"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-500 p-3 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-red-300 font-medium text-lg">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default YTFollowUp;