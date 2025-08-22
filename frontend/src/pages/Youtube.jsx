import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../components/Sidebar';
import YTTranscribe from '../components/YTTranscribe';
import YTStudyBoard from '../components/YTStudyBoard';
import YTFollowUp from '../components/YTFollowUp';
import { useUser } from '../context/UserContext';
import {
  Loader2, AlertCircle, BrainCircuit, FileText, MessageCircle, Youtube
} from 'lucide-react';
import toast from 'react-hot-toast';

const YouTubePage = () => {
  const { mongoUid, firebaseUid, loading: userLoading } = useUser();
  const [activeComponent, setActiveComponent] = useState('transcribe');
  const [unifiedUrl, setUnifiedUrl] = useState('');
  const [unifiedVideoData, setUnifiedVideoData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const components = [
    {
      id: 'transcribe',
      label: 'Quick Summarize',
      icon: FileText,
      description: 'Get quick AI summaries in 3 formats',
      component: YTTranscribe
    },
    {
      id: 'studyboard',
      label: 'Study Board',
      icon: BrainCircuit,
      description: 'Create comprehensive study materials',
      component: YTStudyBoard
    },
    {
      id: 'followup',
      label: 'Follow-up Chat',
      icon: MessageCircle,
      description: 'Ask questions about the video content',
      component: YTFollowUp
    }
  ];

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const processUnifiedVideo = async () => {
    if (!unifiedUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(unifiedUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (!firebaseUid || !mongoUid) {
      toast.error('Please log in to use this feature');
      return;
    }

    setIsProcessing(true);
    
    try {
      // First, get the summary data
      const summaryResponse = await fetch('http://localhost:5000/api/youtube/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: unifiedUrl.trim(),
          userId: mongoUid
        }),
      });

      const summaryData = await summaryResponse.json();

      if (summaryResponse.ok && summaryData.success) {
        setUnifiedVideoData(summaryData.data);
        toast.success('Video processed successfully! All tools are now ready to use.');
      } else {
        throw new Error(summaryData.error || 'Failed to process video');
      }
    } catch (err) {
      console.error('Error processing video:', err);
      toast.error(err.message || 'Failed to process video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    processUnifiedVideo();
  };

  // Show loading spinner while user data is being fetched
  if (userLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-400" />
            <p className="text-gray-400">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not properly authenticated
  if (!firebaseUid || !mongoUid) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">
              Please log in and ensure your profile is synced to use the YouTube tools.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ActiveComponent = components.find(comp => comp.id === activeComponent)?.component || YTTranscribe;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header with Component Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                YouTube
              </span> AI Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Transform YouTube videos into powerful learning materials with our AI-powered tools.
            </p>

            {/* Unified URL Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-red-500 to-purple-500 p-3 rounded-xl">
                  <Youtube className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold ml-3">Universal YouTube Processor</h3>
              </div>
              <p className="text-gray-400 mb-6 text-sm">
                Paste any YouTube URL below to unlock all three AI tools simultaneously
              </p>
              
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={unifiedUrl}
                    onChange={(e) => setUnifiedUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    disabled={isProcessing}
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isProcessing || !unifiedUrl.trim()}
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing Video...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-6 h-6" />
                      <span>Process Video for All Tools</span>
                    </>
                  )}
                </motion.button>
              </form>

              {unifiedVideoData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-green-500 p-1 rounded-full">
                      <Youtube className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-green-400 font-medium">Video Processed Successfully!</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    <strong>{unifiedVideoData.video.title}</strong> by {unifiedVideoData.video.channel}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    All tools now have access to this video's content. Switch between tabs to explore different features.
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Component Selector */}
            <div className="flex justify-center space-x-4 mb-8">
              {components.map((comp) => {
                const Icon = comp.icon;
                return (
                  <motion.button
                    key={comp.id}
                    onClick={() => setActiveComponent(comp.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                      activeComponent === comp.id
                        ? 'bg-gradient-to-r from-red-500 to-purple-500 border-transparent text-white shadow-lg'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`p-3 rounded-xl ${
                        activeComponent === comp.id 
                          ? 'bg-white/20' 
                          : 'bg-gray-800'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold mb-1">{comp.label}</h3>
                        <p className={`text-sm ${
                          activeComponent === comp.id 
                            ? 'text-white/80' 
                            : 'text-gray-500'
                        }`}>
                          {comp.description}
                        </p>
                      </div>
                    </div>
                    
                    {activeComponent === comp.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-500 rounded-2xl"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Active Component */}
          <motion.div
            key={activeComponent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent 
              videoData={unifiedVideoData} 
              onVideoDataUpdate={setUnifiedVideoData}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePage;
