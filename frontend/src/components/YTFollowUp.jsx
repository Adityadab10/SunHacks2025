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
      setMessages([]);
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

  const loadChatHistory = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setCurrentSession(data.data);
        setMessages(data.data.messages || []);
        setError(null);
      } else {
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

      if (response.ok && data.success) {
        // Add AI response to messages
        const aiMessage = {
          role: 'assistant',
          content: data.data.message,
          timestamp: data.data.timestamp
        };
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
    <div className="p-6 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{currentSession.videoTitle}</h3>
          <p className="text-gray-400 text-sm">{currentSession.videoChannel}</p>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 text-sm">Chat Ready</span>
        </div>
      </div>
    </div>
  );

  const renderMessagesArea = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h4 className="text-xl font-semibold text-white mb-2">Ready to Chat!</h4>
            <p className="text-gray-400 max-w-md">
              Ask anything about this video! I have access to the transcript and summary to help answer your questions.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 max-w-md">
              <button
                onClick={() => setNewMessage("What are the main points covered in this video?")}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                "What are the main points covered in this video?"
              </button>
              <button
                onClick={() => setNewMessage("Can you explain the most important concept?")}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                "Can you explain the most important concept?"
              </button>
              <button
                onClick={() => setNewMessage("What should I remember from this video?")}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                "What should I remember from this video?"
              </button>
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
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-2 rounded-full ${
                  message.role === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}>
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="text-gray-100 mb-2 last:mb-0">{children}</p>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-700 text-blue-400 px-2 py-1 rounded text-sm">{children}</code>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-100 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-100 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-100">{children}</li>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="flex items-center justify-end mt-2">
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {sendingMessage && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );

  const renderMessageInput = () => (
    <div className="p-6 border-t border-gray-800">
      <form onSubmit={sendMessage} className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask a question about this video..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            disabled={sendingMessage}
          />
        </div>
        <motion.button
          type="submit"
          disabled={sendingMessage || !newMessage.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );

  if (isPreloaded && currentSession) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Follow-up Chat
            </span>
          </h2>
          <p className="text-gray-400">Ask questions about the video content with AI</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sessions Sidebar - same as existing */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No chat sessions yet</p>
                ) : (
                  sessions.map((session) => (
                    <motion.div
                      key={session.sessionId}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentSession?.sessionId === session.sessionId
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                      onClick={() => loadChatHistory(session.sessionId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.videoTitle}
                          </p>
                          <p className="text-xs opacity-70 truncate">
                            {session.videoChannel}
                          </p>
                          <div className="flex items-center mt-1 text-xs opacity-60">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {session.messageCount} messages
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.sessionId);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )
            }
              </div>
            </div>
          </div>

          {/* Main Chat Area - same as existing but with auto-started session */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 h-[600px] flex flex-col">
              {/* Chat Header */}
              {renderChatHeader()}

              {/* Messages Area */}
              {renderMessagesArea()}

              {/* Message Input - same as existing */}
              {renderMessageInput()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return existing component code for non-preloaded use
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            YouTube
          </span> Follow-up Chat
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Ask follow-up questions about any YouTube video. Get detailed answers based on the transcript and summary.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sessions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No chat sessions yet</p>
              ) : (
                sessions.map((session) => (
                  <motion.div
                    key={session.sessionId}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      currentSession?.sessionId === session.sessionId
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                    onClick={() => loadChatHistory(session.sessionId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.videoTitle}
                        </p>
                        <p className="text-xs opacity-70 truncate">
                          {session.videoChannel}
                        </p>
                        <div className="flex items-center mt-1 text-xs opacity-60">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {session.messageCount} messages
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.sessionId);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              className="bg-gray-900 rounded-2xl p-8 border border-gray-800"
            >
              {!videoData && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Start a New Chat Session
                  </h3>
                  
                  <form onSubmit={handleCreateSession} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-white mb-3">
                        YouTube Video URL
                      </label>
                      <div className="relative">
                        <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          disabled={sessionLoading}
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={sessionLoading}
                      whileHover={{ scale: sessionLoading ? 1 : 1.02 }}
                      whileTap={{ scale: sessionLoading ? 1 : 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      {sessionLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Creating Chat Session...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-6 h-6" />
                          <span>Start Chat Session</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </>
              )}

              {videoData && (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl inline-block mb-6">
                    <BrainCircuit className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Ready to Chat About This Video
                  </h3>
                  <p className="text-gray-400 mb-6">
                    A chat session will be created automatically for the current video.
                  </p>
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <p className="text-white font-medium">{videoData.video.title}</p>
                    <p className="text-gray-400 text-sm">{videoData.video.channel}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    The AI has access to the video's transcript and summary to answer your questions.
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Interactive Chat</h4>
                  <p className="text-gray-400 text-sm">Ask follow-up questions and get detailed answers</p>
                </div>
                <div className="text-center">
                  <div className="bg-cyan-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Context Aware</h4>
                  <p className="text-gray-400 text-sm">AI understands the video content and context</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Chat History</h4>
                  <p className="text-gray-400 text-sm">All conversations are saved for future reference</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 h-[600px] flex flex-col">
              {/* Chat Header */}
              {renderChatHeader()}

              {/* Messages Area */}
              {renderMessagesArea()}

              {/* Message Input - same as existing */}
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
            className="bg-red-900/20 border border-red-500 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YTFollowUp;
