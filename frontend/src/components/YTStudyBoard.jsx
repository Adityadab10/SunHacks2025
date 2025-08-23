import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube, Loader2, CheckCircle, AlertCircle, 
  Clock, User, Save, BrainCircuit, Play, Lock,
  Globe, Users, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';

const YTStudyBoard = ({ preloadedData, isPreloaded = false }) => {
  const { mongoUid, firebaseUid } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(preloadedData || null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [studyBoardName, setStudyBoardName] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [saved, setSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedVisibility, setSelectedVisibility] = useState('private');
  const [selectedGroup, setSelectedGroup] = useState('');

  const TABS = [
    { id: "summary", label: "📝 Summary" },
    { id: "tldr", label: "⚡ TLDR" },
    { id: "detailed", label: "📖 Detailed" },
    { id: "flashcards", label: "🔄 Flashcards" },
    { id: "quiz", label: "❓ Quiz" },
  ];

  const VISIBILITY_OPTIONS = [
    { id: 'private', label: 'Private', icon: Lock, description: 'Only visible to you' },
    { id: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
    { id: 'studygroup', label: 'Study Group', icon: Users, description: 'Share with a study group' },
  ];

  // Fetch user's study groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!mongoUid) return;
      
      try {
        const userEmail = window.localStorage.getItem('userEmail');
        if (!userEmail) return;

        const res = await fetch(`http://localhost:5000/api/group/groups-by-member?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        setUserGroups(data.groups || []);
      } catch (error) {
        console.error('Error fetching user groups:', error);
      }
    };

    fetchUserGroups();
  }, [mongoUid]);

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
          youtubeUrl: url.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        setStudyBoardName(generateStudyBoardName(data.data.video.title));
        toast.success('Study board created! Click save to store it.');
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
    setStudyBoardName(generateStudyBoardName(result.video.title));
    setSelectedVisibility('private');
    setSelectedGroup('');
    setIsSaveModalOpen(true);
  };

  const handleSave = async () => {
    if (!result || !studyBoardName.trim()) {
      toast.error('Please enter a study board name');
      return;
    }

    if (selectedVisibility === 'studygroup' && !selectedGroup) {
      toast.error('Please select a study group');
      return;
    }

    try {
      setLoading(true);
      
      const saveData = {
        youtubeUrl: result.video.url,
        userId: mongoUid,
        studyBoardName: studyBoardName.trim(),
        visibility: selectedVisibility,
        content: result.content
      };

      if (selectedVisibility === 'studygroup') {
        saveData.studyGroupId = selectedGroup;
      }

      const response = await fetch(`http://localhost:5000/api/studyboard-yt/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveSuccess(true);
        setSaved(true);
        setIsSaveModalOpen(false);
        
        let successMessage = 'Study board saved successfully!';
        if (selectedVisibility === 'public') {
          successMessage = 'Study board saved and published publicly!';
        } else if (selectedVisibility === 'studygroup') {
          const groupName = userGroups.find(g => g._id === selectedGroup)?.name;
          successMessage = `Study board shared with ${groupName}!`;
        }
        
        toast.success(successMessage);
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
    if (!isSaveModalOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-black rounded-xl border border-gray-800 p-8 w-[550px] max-w-[90vw] max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            <div className="p-2 bg-[#74AA9C] rounded-lg">
              <Save className="w-5 h-5 text-black" />
            </div>
            Save Study Board
          </h3>
          
          {/* Study Board Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3">Study Board Name</label>
            <input
              type="text"
              value={studyBoardName}
              onChange={(e) => setStudyBoardName(e.target.value)}
              placeholder="Enter study board name"
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#74AA9C]/50 focus:border-[#74AA9C] focus:outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Visibility Options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-4">Visibility</label>
            <div className="space-y-3">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isDisabled = option.id === 'studygroup' && userGroups.length === 0;
                
                return (
                  <div
                    key={option.id}
                    onClick={() => !isDisabled && setSelectedVisibility(option.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedVisibility === option.id
                        ? 'border-[#74AA9C] bg-[#74AA9C]/10 shadow-md'
                        : isDisabled
                        ? 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${
                        selectedVisibility === option.id ? 'text-[#74AA9C]' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{option.label}</span>
                          {isDisabled && (
                            <span className="text-xs text-gray-500">(No groups available)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedVisibility === option.id
                          ? 'border-[#74AA9C] bg-[#74AA9C]'
                          : 'border-gray-500'
                      }`}>
                        {selectedVisibility === option.id && (
                          <div className="w-2 h-2 rounded-full bg-black" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Study Group Selection */}
          {selectedVisibility === 'studygroup' && userGroups.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3">Select Study Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#74AA9C]/50 focus:border-[#74AA9C] focus:outline-none transition-all"
              >
                <option value="">Choose a study group...</option>
                {userGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name} ({group.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !studyBoardName.trim() || (selectedVisibility === 'studygroup' && !selectedGroup)}
              className="px-8 py-3 bg-[#74AA9C] text-black font-semibold rounded-lg hover:bg-[#74AA9C]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Study Board
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Update result when preloadedData changes
  useEffect(() => {
    if (preloadedData) {
      setResult(preloadedData);
      setActiveTab('summary');
      setSaved(false); // Don't mark as saved - allow user to choose save options
    }
  }, [preloadedData]);

  // Don't show the input form if data is preloaded
  if (isPreloaded && result) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] rounded-2xl shadow-xl">
                <BrainCircuit className="w-12 h-12 text-black" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74AA9C] to-white">
                Study Board
              </span>
            </h2>
            <p className="text-gray-300 text-lg">Comprehensive study materials with flashcards and quizzes</p>
          </motion.div>

          {/* Results Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-950 rounded-2xl p-8 border border-gray-800 shadow-2xl"
              >
                {/* Study Board Header - show save options */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] p-3 rounded-xl shadow-lg">
                      <BrainCircuit className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Study Board Ready</h3>
                      <p className="text-gray-400">Click save to store with your preferred visibility</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {!saved ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openSaveModal}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl transition-all flex items-center gap-2 bg-[#74AA9C] hover:bg-[#74AA9C]/90 disabled:bg-[#74AA9C]/50 disabled:cursor-not-allowed text-black font-semibold shadow-lg hover:shadow-xl"
                      >
                        <Save className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Study Board'}
                      </motion.button>
                    ) : saveSuccess ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-[#74AA9C] flex items-center gap-2 bg-[#74AA9C]/10 px-6 py-3 rounded-xl border border-[#74AA9C]/30 shadow-lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Saved Successfully
                      </motion.div>
                    ) : (
                      <div className="text-[#74AA9C] flex items-center gap-2 bg-[#74AA9C]/10 px-6 py-3 rounded-xl border border-[#74AA9C]/30">
                        <CheckCircle className="w-5 h-5" />
                        Study Board Saved
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                {result.video && (
                  <div className="grid md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Play className="w-5 h-5 text-[#74AA9C]" />
                        <span className="text-gray-400 text-sm font-medium">Title</span>
                      </div>
                      <p className="text-white font-semibold">{result.video?.title || result.videoTitle}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-[#74AA9C]" />
                        <span className="text-gray-400 text-sm font-medium">Channel</span>
                      </div>
                      <p className="text-white font-semibold">{result.video?.channel || result.videoChannel || 'Unknown'}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-[#74AA9C]" />
                        <span className="text-gray-400 text-sm font-medium">Duration</span>
                      </div>
                      <p className="text-white font-semibold">{result.video?.duration || result.videoDuration || 'Unknown'}</p>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto bg-gray-900 p-2 rounded-xl">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-lg transition-all whitespace-nowrap font-medium ${
                        activeTab === tab.id
                          ? "bg-[#74AA9C] text-black shadow-lg"
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
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                      <ul className="list-none space-y-3">
                        {result.content.summary.map((point, idx) => (
                          <li key={idx} className="text-gray-200 flex items-start gap-3">
                            <span className="w-2 h-2 bg-[#74AA9C] rounded-full mt-2 flex-shrink-0"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeTab === "tldr" && result.content.tldr && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                      <p className="text-lg text-gray-200 leading-relaxed">{result.content.tldr}</p>
                    </div>
                  )}

                  {activeTab === "detailed" && result.content.detailedSummary && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                      <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {result.content.detailedSummary}
                      </div>
                    </div>
                  )}

                  {activeTab === "flashcards" && result.content.flashcards?.length > 0 && (
                    <div className="space-y-6">
                      {result.content.flashcards.map((card, idx) => (
                        <motion.div
                          key={idx}
                          onClick={() => toggleCard(idx)}
                          whileHover={{ scale: 1.01 }}
                          className={`bg-gray-900 rounded-xl border border-gray-800 p-6 transition-all hover:border-[#74AA9C]/50 cursor-pointer relative min-h-[180px] shadow-lg ${
                            flippedCards[idx] ? "shadow-xl border-[#74AA9C]/30" : ""
                          }`}
                        >
                          <div
                            className={`transition-all duration-300 ${
                              flippedCards[idx] ? "opacity-0" : "opacity-100"
                            }`}
                          >
                            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                              <span className="w-3 h-3 bg-[#74AA9C] rounded-full"></span>
                              Question:
                            </h3>
                            <p className="text-gray-200 leading-relaxed">{card.question}</p>
                          </div>

                          <div
                            className={`absolute inset-0 p-6 transition-all duration-300 rounded-xl ${
                              flippedCards[idx]
                                ? "opacity-100 transform translate-y-0 bg-gray-900 border border-gray-800"
                                : "opacity-0 transform translate-y-4"
                            }`}
                          >
                            <h3 className="text-xl font-bold mb-4 text-[#74AA9C] flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Answer:
                            </h3>
                            <p className="text-gray-200 leading-relaxed">{card.answer}</p>
                          </div>

                          <div className="absolute bottom-4 right-4">
                            <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                              {flippedCards[idx] ? "Click to hide" : "Click to reveal"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === "quiz" && result.content.quiz?.length > 0 && (
                    <div className="space-y-8">
                      {result.content.quiz.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="border border-gray-800 rounded-xl p-6 bg-gray-900 shadow-lg"
                        >
                          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="bg-[#74AA9C] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                              {qIndex + 1}
                            </span>
                            {question.question}
                          </h3>
                          <div className="space-y-3">
                            {question.options.map((option, oIndex) => (
                              <button
                                key={oIndex}
                                onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                disabled={showExplanations[qIndex]}
                                className={`w-full text-left p-4 rounded-lg text-white transition-all font-medium ${
                                  selectedAnswers[qIndex] === oIndex
                                    ? option.isCorrect
                                      ? "bg-[#74AA9C]/20 border-[#74AA9C] shadow-lg"
                                      : "bg-red-500/20 border-red-500 shadow-lg"
                                    : showExplanations[qIndex] && option.isCorrect
                                    ? "bg-[#74AA9C]/20 border-[#74AA9C]"
                                    : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                                } border-2`}
                              >
                                <span className="font-bold mr-3 text-[#74AA9C]">
                                  {option.label}.
                                </span>
                                {option.text}
                                {showExplanations[qIndex] && option.isCorrect && (
                                  <span className="ml-3 text-[#74AA9C]">✓</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {showExplanations[qIndex] && (
                            <div
                              className={`mt-6 p-4 rounded-lg border-2 ${
                                question.options[selectedAnswers[qIndex]]?.isCorrect
                                  ? "bg-[#74AA9C]/10 border-[#74AA9C]/30"
                                  : "bg-red-500/10 border-red-500/30"
                              }`}
                            >
                              <p className="text-sm font-bold mb-2 text-white">
                                Correct Answer: {question.correctAnswer}
                              </p>
                              <p className="text-sm text-gray-300 leading-relaxed">
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
      </div>
    );
  }

  // Return existing component code for non-preloaded use
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="p-5 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] rounded-3xl shadow-2xl">
              <BrainCircuit className="w-16 h-16 text-black" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74AA9C] to-white">
              Study Board
            </span>{" "}
            <span className="text-white">Generator</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Create comprehensive study materials from YouTube videos including flashcards, quizzes, and detailed summaries.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-950 rounded-2xl p-8 border border-gray-800 shadow-2xl max-w-4xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-xl font-bold text-white mb-4">
                YouTube Video URL
              </label>
              <div className="relative">
                <Youtube className="absolute left-5 top-1/2 transform -translate-y-1/2 text-[#74AA9C] w-6 h-6" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-16 pr-6 py-5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#74AA9C] focus:ring-2 focus:ring-[#74AA9C]/30 transition-all duration-200 text-lg"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-[#74AA9C] to-[#5a8a7a] hover:from-[#74AA9C]/90 hover:to-[#5a8a7a]/90 disabled:from-gray-600 disabled:to-gray-700 text-black py-5 rounded-xl font-bold text-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>Creating Study Board...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-7 h-7" />
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
              className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-4xl mx-auto shadow-lg"
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
              className="bg-gray-950 rounded-2xl p-8 border border-gray-800 shadow-2xl"
            >
              {/* Study Board Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-[#74AA9C] to-[#5a8a7a] p-3 rounded-xl shadow-lg">
                    <BrainCircuit className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Study Board Ready</h3>
                    <p className="text-gray-400">Click save to store with your preferred visibility</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {!saved ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openSaveModal}
                      disabled={loading}
                      className="px-8 py-3 rounded-xl transition-all flex items-center gap-2 bg-[#74AA9C] hover:bg-[#74AA9C]/90 disabled:bg-[#74AA9C]/50 disabled:cursor-not-allowed text-black font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : 'Save Study Board'}
                    </motion.button>
                  ) : saveSuccess ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-[#74AA9C] flex items-center gap-2 bg-[#74AA9C]/10 px-6 py-3 rounded-xl border border-[#74AA9C]/30 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Saved Successfully
                    </motion.div>
                  ) : (
                    <div className="text-[#74AA9C] flex items-center gap-2 bg-[#74AA9C]/10 px-6 py-3 rounded-xl border border-[#74AA9C]/30">
                      <CheckCircle className="w-5 h-5" />
                      Study Board Saved
                    </div>
                  )}
                </div>
              </div>

              {/* Video Info */}
              {result.video && (
                <div className="grid md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-[#74AA9C]" />
                      <span className="text-gray-400 text-sm font-medium">Title</span>
                    </div>
                    <p className="text-white font-semibold">{result.video.title}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-[#74AA9C]" />
                      <span className="text-gray-400 text-sm font-medium">Channel</span>
                    </div>
                    <p className="text-white font-semibold">{result.video.channel || 'Unknown'}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-[#74AA9C]" />
                      <span className="text-gray-400 text-sm font-medium">Duration</span>
                    </div>
                    <p className="text-white font-semibold">{result.video.duration || 'Unknown'}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-8 overflow-x-auto bg-gray-900 p-2 rounded-xl">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg transition-all whitespace-nowrap font-medium ${
                      activeTab === tab.id
                        ? "bg-[#74AA9C] text-black shadow-lg"
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
                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <ul className="list-none space-y-3">
                      {result.content.summary.map((point, idx) => (
                        <li key={idx} className="text-gray-200 flex items-start gap-3">
                          <span className="w-2 h-2 bg-[#74AA9C] rounded-full mt-2 flex-shrink-0"></span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === "tldr" && result.content.tldr && (
                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <p className="text-lg text-gray-200 leading-relaxed">{result.content.tldr}</p>
                  </div>
                )}

                {activeTab === "detailed" && result.content.detailedSummary && (
                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {result.content.detailedSummary}
                    </div>
                  </div>
                )}

                {activeTab === "flashcards" && result.content.flashcards?.length > 0 && (
                  <div className="space-y-6">
                    {result.content.flashcards.map((card, idx) => (
                      <motion.div
                        key={idx}
                        onClick={() => toggleCard(idx)}
                        whileHover={{ scale: 1.01 }}
                        className={`bg-gray-900 rounded-xl border border-gray-800 p-6 transition-all hover:border-[#74AA9C]/50 cursor-pointer relative min-h-[180px] shadow-lg ${
                          flippedCards[idx] ? "shadow-xl border-[#74AA9C]/30" : ""
                        }`}
                      >
                        <div
                          className={`transition-all duration-300 ${
                            flippedCards[idx] ? "opacity-0" : "opacity-100"
                          }`}
                        >
                          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                            <span className="w-3 h-3 bg-[#74AA9C] rounded-full"></span>
                            Question:
                          </h3>
                          <p className="text-gray-200 leading-relaxed">{card.question}</p>
                        </div>

                        <div
                          className={`absolute inset-0 p-6 transition-all duration-300 rounded-xl ${
                            flippedCards[idx]
                              ? "opacity-100 transform translate-y-0 bg-gray-900 border border-gray-800"
                              : "opacity-0 transform translate-y-4"
                          }`}
                        >
                          <h3 className="text-xl font-bold mb-4 text-[#74AA9C] flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Answer:
                          </h3>
                          <p className="text-gray-200 leading-relaxed">{card.answer}</p>
                        </div>

                        <div className="absolute bottom-4 right-4">
                          <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                            {flippedCards[idx] ? "Click to hide" : "Click to reveal"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === "quiz" && result.content.quiz?.length > 0 && (
                  <div className="space-y-8">
                    {result.content.quiz.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="border border-gray-800 rounded-xl p-6 bg-gray-900 shadow-lg"
                      >
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="bg-[#74AA9C] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {qIndex + 1}
                          </span>
                          {question.question}
                        </h3>
                        <div className="space-y-3">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              onClick={() => handleAnswerSelect(qIndex, oIndex)}
                              disabled={showExplanations[qIndex]}
                              className={`w-full text-left p-4 rounded-lg text-white transition-all font-medium ${
                                selectedAnswers[qIndex] === oIndex
                                  ? option.isCorrect
                                    ? "bg-[#74AA9C]/20 border-[#74AA9C] shadow-lg"
                                    : "bg-red-500/20 border-red-500 shadow-lg"
                                  : showExplanations[qIndex] && option.isCorrect
                                  ? "bg-[#74AA9C]/20 border-[#74AA9C]"
                                  : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                              } border-2`}
                            >
                              <span className="font-bold mr-3 text-[#74AA9C]">
                                {option.label}.
                              </span>
                              {option.text}
                              {showExplanations[qIndex] && option.isCorrect && (
                                <span className="ml-3 text-[#74AA9C]">✓</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {showExplanations[qIndex] && (
                          <div
                            className={`mt-6 p-4 rounded-lg border-2 ${
                              question.options[selectedAnswers[qIndex]]?.isCorrect
                                ? "bg-[#74AA9C]/10 border-[#74AA9C]/30"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            <p className="text-sm font-bold mb-2 text-white">
                              Correct Answer: {question.correctAnswer}
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed">
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
    </div>
  );
};

export default YTStudyBoard;