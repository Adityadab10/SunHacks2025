import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import MainSidebar from '../components/Sidebar';
import { useUser } from '../context/UserContext';
import {
  Youtube, Play, Loader2, CheckCircle, AlertCircle, 
  Clock, User, Copy, Download, Sparkles, Zap, 
  BarChart3, FileText, BrainCircuit, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const YouTubePage = () => {
  const { mongoUid, firebaseUid, loading: userLoading } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('brief');

  // Define tabs array to fix the mapping issue
  const TABS = [
    { key: 'brief', label: 'Brief', Icon: Zap },
    { key: 'detailed', label: 'Detailed', Icon: FileText },
    { key: 'bulletPoints', label: 'Bullet Points', Icon: BarChart3 }
  ];

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    // Check if user is logged in and MongoDB UID is available
    if (!firebaseUid) {
      toast.error('Please log in to use this feature');
      return;
    }

    if (!mongoUid) {
      toast.error('User profile not synced. Please try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/youtube/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: url.trim(),
          userId: mongoUid // Use MongoDB UID from context
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Validate that we have all required summaries
        if (!data.data?.summaries?.brief || !data.data?.summaries?.detailed || !data.data?.summaries?.bulletPoints) {
          throw new Error('Incomplete summary data received');
        }
        
        setResult(data.data);
        toast.success('Video summarized and saved successfully!');
        setActiveTab('brief'); // Reset to first tab
      } else {
        const errorMsg = data.error || `Server error: ${response.status}`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Cannot connect to server. Please make sure the backend is running.' 
        : err.message || 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadSummary = (summaryType) => {
    if (!result) return;
    
    const summaryData = result.summaries[summaryType];
    const content = `YouTube Video Summary - ${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)}

Title: ${result.video.title}
Channel: ${result.video.channel}
Duration: ${result.video.duration}
URL: ${result.video.url}

Summary:
${summaryData.content}

Generated on: ${new Date(summaryData.generatedAt).toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube-summary-${summaryType}-${result.video.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('Summary downloaded!');
  };

  const downloadAllSummaries = () => {
    if (!result) return;
    
    const content = `YouTube Video - All Summaries

Title: ${result.video.title}
Channel: ${result.video.channel}
Duration: ${result.video.duration}
URL: ${result.video.url}

=== BRIEF SUMMARY ===
${result.summaries.brief.content}

=== DETAILED SUMMARY ===
${result.summaries.detailed.content}

=== BULLET POINTS SUMMARY ===
${result.summaries.bulletPoints.content}

Generated on: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube-all-summaries-${result.video.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('All summaries downloaded!');
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
              Please log in and ensure your profile is synced to use the YouTube summarizer.
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

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-2xl">
                <Youtube className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                YouTube
              </span> Video Summarizer
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Transform any YouTube video into 3 different types of intelligent summaries with AI. 
              Get brief, detailed, and bullet-point summaries all at once.
            </p>
          </motion.div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
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
                    className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Generating All Summaries...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-6 h-6" />
                    <span>Generate All Summary Types</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-8"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Video Info Card */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Video Processed</h2>
                        <p className="text-gray-400">All 3 summary types generated successfully</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadAllSummaries}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download All</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Play className="w-4 h-4 text-red-400" />
                        <span className="text-gray-400 text-sm">Title</span>
                      </div>
                      <p className="text-white font-medium">{result.video.title}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-red-400" />
                        <span className="text-gray-400 text-sm">Channel</span>
                      </div>
                      <p className="text-white font-medium">{result.video.channel}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-red-400" />
                        <span className="text-gray-400 text-sm">Duration</span>
                      </div>
                      <p className="text-white font-medium">{result.video.duration}</p>
                    </div>
                  </div>

                  <a
                    href={result.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>

                {/* Summary Tabs */}
                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">AI Summaries</h3>
                        <p className="text-gray-400 text-sm">Three different summary formats</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-medium">AI Generated</span>
                    </div>
                  </div>

                  {/* Tab Navigation - FIXED */}
                  <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
                    {TABS.map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          activeTab === key 
                            ? 'bg-red-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content - IMPROVED SAFETY */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {(() => {
                        const activeSummary = result?.summaries?.[activeTab];
                        
                        if (!activeSummary) {
                          return (
                            <div className="text-center py-8">
                              <p className="text-gray-400">Summary not available</p>
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-white capitalize">
                                {activeTab === 'bulletPoints' ? 'Bullet Points' : activeTab} Summary
                              </h4>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => copyToClipboard(activeSummary.content)}
                                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => downloadSummary(activeTab)}
                                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>

                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                              <div className="prose prose-invert max-w-none">
                                <ReactMarkdown 
                                  components={{
                                    h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-1">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-lg font-semibold text-white mb-2">{children}</h3>,
                                    h4: ({children}) => <h4 className="text-base font-semibold text-gray-100 mb-2">{children}</h4>,
                                    p: ({children}) => <p className="text-gray-200 mb-3 leading-relaxed">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1 pl-4">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1 pl-4">{children}</ol>,
                                    li: ({children}) => <li className="text-gray-200 mb-1 leading-relaxed">{children}</li>,
                                    strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                    em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                                    code: ({children}) => <code className="bg-gray-700 text-red-400 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                                    pre: ({children}) => <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto mb-3 text-gray-200">{children}</pre>,
                                    blockquote: ({children}) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-300 mb-3 bg-gray-800/50 py-2">{children}</blockquote>,
                                    a: ({href, children}) => <a href={href} className="text-red-400 hover:text-red-300 underline transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                                    hr: () => <hr className="border-gray-600 my-4" />,
                                    table: ({children}) => <table className="w-full border-collapse border border-gray-600 mb-3">{children}</table>,
                                    th: ({children}) => <th className="border border-gray-600 px-3 py-2 bg-gray-700 text-white font-semibold text-left">{children}</th>,
                                    td: ({children}) => <td className="border border-gray-600 px-3 py-2 text-gray-200">{children}</td>
                                  }}
                                >
                                  {activeSummary.content || 'No content available'}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Generated on {new Date(activeSummary.generatedAt).toLocaleString()}</span>
                              <span>Powered by StudyGenie AI</span>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Section */}
          {!result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-6 mt-12"
            >
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Triple Summary</h3>
                <p className="text-gray-400 text-sm">Get brief, detailed, and bullet-point summaries all at once</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Powered</h3>
                <p className="text-gray-400 text-sm">Powered by Google's Gemini AI for accurate analysis</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-gray-400 text-sm">Download individual summaries or all three formats together</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubePage;
