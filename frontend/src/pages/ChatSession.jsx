import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Youtube,
  Loader2,
  MessageCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

const ChatSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { mongoUid } = useUser();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchChatSession() {
      if (mongoUid && sessionId) {
        console.log('Fetching chat session:', { mongoUid, sessionId });
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${sessionId}`);
          const data = await response.json();
          console.log('Chat session response:', data);
          
          if (data.success) {
            setSession(data.data.session);
            setMessages(data.data.messages || []);
            console.log('Set session:', data.data.session);
            console.log('Set messages:', data.data.messages);
          } else {
            console.error('Failed to fetch chat session:', data.error);
            setError('Chat session not found');
          }
        } catch (error) {
          console.error('Error fetching chat session:', error);
          setError('Failed to load chat session');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Missing required data:', { mongoUid, sessionId });
      }
    }
    fetchChatSession();
  }, [mongoUid, sessionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    console.log('Sending message:', newMessage.trim());

    const userMessage = {
      id: Date.now(),
      message: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const requestBody = {
        message: userMessage.message,
        userId: mongoUid
      };
      console.log('Sending request:', requestBody);

      const response = await fetch(`http://localhost:5000/api/youtube/chat/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Message response:', data);

      if (data.success && data.data.aiResponse) {
        const aiMessage = {
          id: Date.now() + 1,
          message: data.data.aiResponse,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        console.log('Added AI message:', aiMessage);
      } else {
        console.error('Failed to get AI response:', data.error);
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        message: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading chat session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Chat Session Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#111] to-[#222] text-white flex font-sans relative">
      {/* Floating accent shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 bg-[#74AA9C]/30 rounded-full blur-2xl"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <MainSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="relative rounded-b-3xl bg-gradient-to-br from-black via-[#222] to-[#222] border-b border-[#74AA9C]/30 px-6 py-4 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#74AA9C]/20 via-black/30 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[#74AA9C] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] p-2 rounded-lg shadow-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent">
                    {session?.videoTitle}
                  </h1>
                  <p className="text-[#74AA9C]/80">{session?.videoChannel}</p>
                </div>
              </div>
            </div>
            <a
              href={session?.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[#74AA9C] hover:text-white transition-colors"
            >
              <Youtube className="w-4 h-4" />
              <span>Watch Video</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-[#74AA9C] mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-white">Start the conversation</h2>
                <p className="text-[#74AA9C]/80">Ask me anything about this video!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={`${message.sender}-${message.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    message.sender === 'user' 
                      ? 'bg-[#74AA9C]' 
                      : message.isError 
                        ? 'bg-red-500/20' 
                        : 'bg-gray-700'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className={`w-4 h-4 ${message.isError ? 'text-red-400' : 'text-[#74AA9C]'}`} />
                    )}
                  </div>
                  <div className={`flex-1 max-w-2xl ${
                    message.sender === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`inline-block p-4 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white'
                        : message.isError
                          ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                          : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-[#74AA9C]/20 text-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <div className={`mt-1 text-xs text-[#74AA9C]/60 ${
                      message.sender === 'user' ? 'text-right' : ''
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <div className="bg-gray-700 p-2 rounded-full">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-gray-400">AI is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-gradient-to-br from-black via-[#222] to-[#222] border-t border-[#74AA9C]/30 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about this video..."
                  className="w-full bg-gray-800/50 border border-[#74AA9C]/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#74AA9C] resize-none max-h-32"
                  rows="1"
                  disabled={sending}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-all duration-300 shadow-lg"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .glass {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default ChatSession;
