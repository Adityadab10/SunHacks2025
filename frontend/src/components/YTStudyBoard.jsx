import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube, Loader2, CheckCircle, AlertCircle, 
  Clock, User, Download, BrainCircuit, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';

const YTStudyBoard = () => {
  const { mongoUid, firebaseUid } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [studyBoardName, setStudyBoardName] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [saved, setSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const TABS = [
    { id: "summary", label: "📝 Summary" },
    { id: "tldr", label: "⚡ TLDR" },
    { id: "detailed", label: "📖 Detailed" },
    { id: "flashcards", label: "🔄 Flashcards" },
    { id: "quiz", label: "❓ Quiz" },
  ];

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const generateStudyBoardName = (videoTitle) => {
    return `${videoTitle.substring(0, 50)}... - Study Board`;
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

    if (!firebaseUid || !mongoUid) {
      toast.error('Please log in to use this feature');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    setSaveSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/studyboard-yt/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: url.trim(),
          userId: mongoUid,
          studyBoardName: 'Temporary Study Board'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        setStudyBoardName(data.data.studyBoardName);
        toast.success('Study board created successfully!');
        setActiveTab('summary');
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

  const openSaveModal = () => {
    if (!result) {
      toast.error('No study board to save');
      return;
    }
    setStudyBoardName(result.studyBoardName || generateStudyBoardName(result.videoTitle || 'YouTube Video'));
    setIsNameModalOpen(true);
  };

  const handleSave = async () => {
    if (!result) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/studyboard-yt/${result.studyBoardId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyBoardName: studyBoardName.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveSuccess(true);
        setSaved(true);
        setIsNameModalOpen(false);
        setResult(prev => ({
          ...prev,
          studyBoardName: data.data.studyBoardName
        }));
        toast.success('Study board saved successfully!');
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        toast.error(data.error || 'Failed to save study board');
      }
    } catch (error) {
      console.error('Error saving study board:', error);
      toast.error('Failed to save study board');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
    setShowExplanations((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  };

  const toggleCard = (idx) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const renderSaveModal = () => {
    if (!isNameModalOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-[400px] max-w-[90vw]"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">💾 Save Study Board</h3>
          <p className="text-gray-400 text-sm mb-4">Give your study board a custom name before saving to your collection</p>
          <input
            type="text"
            value={studyBoardName}
            onChange={(e) => setStudyBoardName(e.target.value)}
            placeholder="Enter study board name"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4 focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && studyBoardName.trim()) {
                handleSave();
              } else if (e.key === 'Escape') {
                setIsNameModalOpen(false);
              }
            }}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsNameModalOpen(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !studyBoardName.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Study Board
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
            <BrainCircuit className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            Study Board
          </span> Generator
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Create comprehensive study materials from YouTube videos including flashcards, quizzes, and detailed summaries.
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 rounded-2xl p-8 border border-gray-800"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Creating Study Board...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-6 h-6" />
                <span>Generate Study Board</span>
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
            className="bg-red-900/20 border border-red-500 rounded-xl p-6"
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
            className="bg-gray-900 rounded-2xl p-8 border border-gray-800"
          >
            {/* Study Board Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Study Board Created</h3>
                  <p className="text-gray-400 text-sm">{result.studyBoardName}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {!saved ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openSaveModal}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-all flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Study Board'}
                  </motion.button>
                ) : saveSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-green-400 flex items-center gap-2 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/30"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Saved Successfully
                  </motion.div>
                ) : (
                  <div className="text-green-400 flex items-center gap-2 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/30">
                    <CheckCircle className="w-5 h-5" />
                    Study Board Saved
                  </div>
                )}
              </div>
            </div>

            {/* Video Info */}
            {result.videoTitle && (
              <div className="grid md:grid-cols-3 gap-6 mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">Title</span>
                  </div>
                  <p className="text-white font-medium">{result.videoTitle}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">Channel</span>
                  </div>
                  <p className="text-white font-medium">{result.videoChannel || 'Unknown'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">Duration</span>
                  </div>
                  <p className="text-white font-medium">{result.videoDuration || 'Unknown'}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none">
              {activeTab === "summary" && result.content.summary?.length > 0 && (
                <ul className="list-disc pl-4 space-y-2">
                  {result.content.summary.map((point, idx) => (
                    <li key={idx} className="text-gray-200">
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === "tldr" && result.content.tldr && (
                <p className="text-lg text-gray-200">{result.content.tldr}</p>
              )}

              {activeTab === "detailed" && result.content.detailedSummary && (
                <div className="text-gray-200 whitespace-pre-wrap">
                  {result.content.detailedSummary}
                </div>
              )}

              {activeTab === "flashcards" && result.content.flashcards?.length > 0 && (
                <div className="space-y-6">
                  {result.content.flashcards.map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleCard(idx)}
                      className={`bg-gray-800 backdrop-blur-sm rounded-xl border border-gray-700 p-6 transition-all hover:bg-gray-750 cursor-pointer relative min-h-[150px] ${
                        flippedCards[idx] ? "shadow-lg" : ""
                      }`}
                    >
                      <div
                        className={`transition-all duration-300 ${
                          flippedCards[idx] ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        <h3 className="text-xl font-semibold mb-3 text-white">Question:</h3>
                        <p className="text-gray-200">{card.question}</p>
                      </div>

                      <div
                        className={`absolute inset-0 p-6 transition-all duration-300 rounded-xl ${
                          flippedCards[idx]
                            ? "opacity-100 transform translate-y-0 bg-gray-800 backdrop-blur-sm border border-gray-700"
                            : "opacity-0 transform translate-y-4"
                        }`}
                      >
                        <h3 className="text-xl font-semibold mb-3 text-purple-400">
                          Answer:
                        </h3>
                        <p className="text-gray-200">{card.answer}</p>
                      </div>

                      <div className="absolute bottom-4 right-4">
                        <span className="text-sm text-gray-500">
                          {flippedCards[idx]
                            ? "Click to hide answer"
                            : "Click to reveal answer"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "quiz" && result.content.quiz?.length > 0 && (
                <div className="space-y-8">
                  {result.content.quiz.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="border border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">
                        {qIndex + 1}. {question.question}
                      </h3>
                      <div className="space-y-3">
                        {question.options.map((option, oIndex) => (
                          <button
                            key={oIndex}
                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                            disabled={showExplanations[qIndex]}
                            className={`w-full text-left p-3 rounded-lg text-white transition-colors ${
                              selectedAnswers[qIndex] === oIndex
                                ? option.isCorrect
                                  ? "bg-green-500/20 border-green-500/50"
                                  : "bg-red-500/20 border-red-500/50"
                                : showExplanations[qIndex] && option.isCorrect
                                ? "bg-green-500/20 border-green-500/50"
                                : "bg-gray-800 hover:bg-gray-700"
                            } border border-gray-600`}
                          >
                            <span className="font-semibold mr-2">
                              {option.label}.
                            </span>
                            {option.text}
                            {showExplanations[qIndex] && option.isCorrect && (
                              <span className="ml-2 text-green-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>

                      {showExplanations[qIndex] && (
                        <div
                          className={`mt-4 p-4 rounded-lg ${
                            question.options[selectedAnswers[qIndex]]?.isCorrect
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          } border`}
                        >
                          <p className="text-sm font-semibold mb-2 text-white">
                            Correct Answer: {question.correctAnswer}
                          </p>
                          <p className="text-sm text-gray-300">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderSaveModal()}
    </div>
  );
};

export default YTStudyBoard;
