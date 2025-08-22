import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../components/Sidebar';
import YTTranscribe from '../components/YTTranscribe';
import YTStudyBoard from '../components/YTStudyBoard';
import YTFollowUp from '../components/YTFollowUp';
import YTActive from '../components/YTActive';
import { useUser } from '../context/UserContext';
import {
  Loader2, AlertCircle, BrainCircuit, FileText, MessageCircle, Youtube, CheckCircle, Play, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

const YouTubePage = () => {
  const { mongoUid, firebaseUid, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState('transcribe');
  const [unifiedUrl, setUnifiedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState({
    transcribe: null,
    studyboard: null,
    followup: null,
    active: null
  });
  const [processingStatus, setProcessingStatus] = useState({
    transcribe: 'pending',
    studyboard: 'pending', 
    followup: 'pending',
    active: 'pending'
  });
  const [videoInfo, setVideoInfo] = useState(null);

  const components = [
    {
      id: 'transcribe',
      label: 'Quick Summarize',
      icon: FileText,
      description: 'AI summaries in 3 formats',
      component: YTTranscribe
    },
    {
      id: 'studyboard',
      label: 'Study Board',
      icon: BrainCircuit,
      description: 'Comprehensive study materials',
      component: YTStudyBoard
    },
    {
      id: 'followup',
      label: 'Follow-up Chat',
      icon: MessageCircle,
      description: 'Ask questions about content',
      component: YTFollowUp
    },
    {
      id: 'active',
      label: 'Active Recall',
      icon: Brain,
      description: 'Test understanding with Feynman Technique',
      component: YTActive
    }
  ];

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const processAllTools = async () => {
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
    setProcessingStatus({
      transcribe: 'processing',
      studyboard: 'pending',
      followup: 'pending',
      active: 'pending'
    });

    try {
      // Step 1: Generate Transcribe/Summary (this gives us the base data)
      toast.loading('Processing video for transcription...', { id: 'processing' });
      
      const transcribeResponse = await fetch('http://localhost:5000/api/youtube/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: unifiedUrl.trim(),
          userId: mongoUid
        }),
      });

      const transcribeData = await transcribeResponse.json();

      if (transcribeResponse.ok && transcribeData.success) {
        setProcessedData(prev => ({ ...prev, transcribe: transcribeData.data }));
        setVideoInfo(transcribeData.data.video);
        setProcessingStatus(prev => ({ ...prev, transcribe: 'completed', studyboard: 'processing' }));
        toast.loading('Creating study board...', { id: 'processing' });

        // Step 2: Generate Study Board
        const studyboardResponse = await fetch('http://localhost:5000/api/studyboard-yt/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            youtubeUrl: unifiedUrl.trim(),
            userId: mongoUid,
            studyBoardName: `${transcribeData.data.video.title.substring(0, 50)}... - Study Board`
          }),
        });

        const studyboardData = await studyboardResponse.json();

        if (studyboardResponse.ok && studyboardData.success) {
          setProcessedData(prev => ({ ...prev, studyboard: studyboardData.data }));
          setProcessingStatus(prev => ({ ...prev, studyboard: 'completed', followup: 'processing' }));
          toast.loading('Setting up chat session...', { id: 'processing' });

          // Step 3: Create Chat Session
          const chatResponse = await fetch('http://localhost:5000/api/youtube/chat/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: mongoUid,
              videoUrl: unifiedUrl.trim(),
              videoTitle: transcribeData.data.video.title,
              videoChannel: transcribeData.data.video.channel
            }),
          });

          const chatData = await chatResponse.json();

          if (chatResponse.ok && chatData.success) {
            setProcessedData(prev => ({ 
              ...prev, 
              followup: {
                sessionData: chatData.data,
                videoData: transcribeData.data
              }
            }));
            setProcessingStatus(prev => ({ ...prev, followup: 'completed', active: 'processing' }));
            toast.loading('Generating active recall questions...', { id: 'processing' });

            // Step 4: Generate Active Recall Questions
            try {
              const questionsResponse = await fetch('http://localhost:5000/api/youtube/active-recall/questions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  transcript: transcribeData.data.transcript || transcribeData.data.summaries.detailed.content,
                  videoTitle: transcribeData.data.video.title
                }),
              });

              const questionsData = await questionsResponse.json();

              if (questionsResponse.ok && questionsData.success) {
                // Generate questions with IDs
                const questionsWithIds = questionsData.data.questions.map((q, index) => ({
                  id: `q${index + 1}`,
                  question: q,
                  difficulty: questionsData.data.difficulties?.[index] || 'medium'
                }));

                setProcessedData(prev => ({ 
                  ...prev, 
                  active: {
                    questions: questionsWithIds,
                    transcript: transcribeData.data.transcript,
                    videoData: transcribeData.data
                  }
                }));
                setProcessingStatus(prev => ({ ...prev, active: 'completed' }));
                toast.success('All tools ready! 🎉', { id: 'processing' });
              } else {
                // Fallback questions if API fails
                const fallbackQuestions = [
                  { id: 'q1', question: 'What are the main concepts explained in this video?', difficulty: 'easy' },
                  { id: 'q2', question: 'How would you explain the key ideas to someone who hasn\'t watched this video?', difficulty: 'medium' },
                  { id: 'q3', question: 'What examples or analogies can you use to clarify the main points?', difficulty: 'medium' },
                  { id: 'q4', question: 'How do these concepts connect to what you already know?', difficulty: 'hard' }
                ];

                setProcessedData(prev => ({ 
                  ...prev, 
                  active: {
                    questions: fallbackQuestions,
                    transcript: transcribeData.data.transcript,
                    videoData: transcribeData.data
                  }
                }));
                setProcessingStatus(prev => ({ ...prev, active: 'completed' }));
                toast.success('All tools ready with default questions! 🎉', { id: 'processing' });
              }
            } catch (questionsError) {
              console.error('Error generating questions:', questionsError);
              // Use fallback questions
              const fallbackQuestions = [
                { id: 'q1', question: 'What are the main concepts explained in this video?', difficulty: 'easy' },
                { id: 'q2', question: 'How would you explain the key ideas to someone who hasn\'t watched this video?', difficulty: 'medium' },
                { id: 'q3', question: 'What examples or analogies can you use to clarify the main points?', difficulty: 'medium' },
                { id: 'q4', question: 'How do these concepts connect to what you already know?', difficulty: 'hard' }
              ];

              setProcessedData(prev => ({ 
                ...prev, 
                active: {
                  questions: fallbackQuestions,
                  transcript: transcribeData.data.transcript,
                  videoData: transcribeData.data
                }
              }));
              setProcessingStatus(prev => ({ ...prev, active: 'completed' }));
              toast.success('All tools ready with default questions! 🎉', { id: 'processing' });
            }
          } else {
            throw new Error('Failed to create chat session');
          }
        } else {
          throw new Error('Failed to create study board');
        }
      } else {
        throw new Error(transcribeData.error || 'Failed to process video');
      }
    } catch (err) {
      console.error('Error processing video:', err);
      toast.error(err.message || 'Failed to process video', { id: 'processing' });
      setProcessingStatus({
        transcribe: 'error',
        studyboard: 'error',
        followup: 'error',
        active: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    processAllTools();
  };

  const resetAll = () => {
    setUnifiedUrl('');
    setProcessedData({ transcribe: null, studyboard: null, followup: null, active: null });
    setProcessingStatus({ transcribe: 'pending', studyboard: 'pending', followup: 'pending', active: 'pending' });
    setVideoInfo(null);
    setActiveTab('transcribe');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-600" />;
    }
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

  const ActiveComponent = components.find(comp => comp.id === activeTab)?.component || YTTranscribe;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                YouTube
              </span> AI Suite
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              One URL, Three Powerful Tools. Transform any YouTube video into summaries, study materials, and interactive chat sessions.
            </p>
          </motion.div>

          {/* Unified URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-purple-500 p-4 rounded-xl">
                <Youtube className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold ml-4">Universal YouTube Processor</h3>
            </div>
            
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  value={unifiedUrl}
                  onChange={(e) => setUnifiedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... (Paste once, get everything!)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-lg"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex gap-4">
                <motion.button
                  type="submit"
                  disabled={isProcessing || !unifiedUrl.trim()}
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing All Tools...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-6 h-6" />
                      <span>Generate All Three Tools</span>
                    </>
                  )}
                </motion.button>
                
                {(videoInfo || isProcessing) && (
                  <motion.button
                    type="button"
                    onClick={resetAll}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
                  >
                    Reset
                  </motion.button>
                )}
              </div>
            </form>

            {/* Processing Status */}
            {isProcessing || videoInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-4"
              >
                {videoInfo && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{videoInfo.title}</h4>
                        <p className="text-gray-400 text-sm mb-2">{videoInfo.channel} • {videoInfo.duration}</p>
                        <a 
                          href={videoInfo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Watch on YouTube →
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Processing Status</h4>
                  <div className="space-y-3">
                    {components.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <comp.icon className="w-5 h-5 text-gray-400" />
                          <span className="text-white">{comp.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(processingStatus[comp.id])}
                          <span className={`text-sm capitalize ${
                            processingStatus[comp.id] === 'completed' ? 'text-green-400' :
                            processingStatus[comp.id] === 'processing' ? 'text-blue-400' :
                            processingStatus[comp.id] === 'error' ? 'text-red-400' : 'text-gray-500'
                          }`}>
                            {processingStatus[comp.id]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Tool Navigation */}
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex justify-center space-x-4">
                {components.map((comp) => {
                  const Icon = comp.icon;
                  const isCompleted = processingStatus[comp.id] === 'completed';
                  const isActive = activeTab === comp.id;
                  
                  return (
                    <motion.button
                      key={comp.id}
                      onClick={() => isCompleted && setActiveTab(comp.id)}
                      disabled={!isCompleted}
                      whileHover={{ scale: isCompleted ? 1.02 : 1 }}
                      whileTap={{ scale: isCompleted ? 0.98 : 1 }}
                      className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                        isActive && isCompleted
                          ? 'bg-gradient-to-r from-red-500 to-purple-500 border-transparent text-white shadow-lg'
                          : isCompleted 
                          ? 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                          : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`p-3 rounded-xl relative ${
                          isActive && isCompleted
                            ? 'bg-white/20' 
                            : isCompleted
                            ? 'bg-gray-800'
                            : 'bg-gray-800'
                        }`}>
                          <Icon className="w-6 h-6" />
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold mb-1">{comp.label}</h3>
                          <p className={`text-sm ${
                            isActive && isCompleted
                              ? 'text-white/80' 
                              : 'text-gray-500'
                          }`}>
                            {comp.description}
                          </p>
                        </div>
                      </div>
                      
                      {isActive && isCompleted && (
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
          )}

          {/* Active Component */}
          {videoInfo && processingStatus[activeTab] === 'completed' && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ActiveComponent 
                preloadedData={processedData[activeTab]}
                videoData={processedData.transcribe}
                isPreloaded={true}
              />
            </motion.div>
          )}

          {/* Welcome Message */}
          {!videoInfo && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center py-16"
            >
              <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Smart Summaries</h3>
                  <p className="text-gray-400 text-sm">Get brief, detailed, and bullet-point summaries powered by AI</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BrainCircuit className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Study Materials</h3>
                  <p className="text-gray-400 text-sm">Create flashcards, quizzes, and comprehensive study guides</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Interactive Chat</h3>
                  <p className="text-gray-400 text-sm">Ask follow-up questions and dive deeper into the content</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Active Recall</h3>
                  <p className="text-gray-400 text-sm">Test understanding using the Feynman Technique</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubePage;
