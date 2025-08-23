import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Youtube, 
  Calendar, 
  User,
  Loader2,
  ExternalLink,
  Clock,
  BookOpen,
  Target,
  CheckCircle2
} from 'lucide-react';

const StudyboardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { mongoUid } = useUser();
  const [studyBoard, setStudyBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [flippedCards, setFlippedCards] = useState({});

  const TABS = [
    { id: "summary", label: "📝 Summary" },
    { id: "tldr", label: "⚡ TLDR" },
    { id: "detailed", label: "📖 Detailed" },
    { id: "flashcards", label: "🔄 Flashcards" },
    { id: "quiz", label: "❓ Quiz" },
  ];

  useEffect(() => {
    async function fetchStudyBoard() {
      if (mongoUid && boardId) {
        setLoading(true);
        setError(null);
        try {
          console.log('Fetching study board with ID:', boardId);
          console.log('Using mongoUid:', mongoUid);
          
          // Try the endpoint - might need to be different based on your backend
          let response = await fetch(`http://localhost:5000/api/studyboard-yt/board/${boardId}`);
          
          // If 404, try alternative endpoint
          if (!response.ok && response.status === 404) {
            console.log('First endpoint failed, trying alternative...');
            response = await fetch(`http://localhost:5000/api/studyboard-yt/${boardId}`);
          }
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Response data:', data);
          
          if (data.success && data.data) {
            setStudyBoard(data.data);
          } else {
            console.error('API returned unsuccessful response:', data);
            setError(data.message || data.error || 'Study board not found');
          }
        } catch (error) {
          console.error('Error fetching study board:', error);
          setError(`Failed to load study board: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Missing mongoUid or boardId:', { mongoUid, boardId });
        setError('Missing required parameters');
        setLoading(false);
      }
    }
    fetchStudyBoard();
  }, [mongoUid, boardId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading study board...</p>
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
            <BrainCircuit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Study Board Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
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
      {/* Green accent floating shapes */}
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
      <div className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl p-10 mb-10 overflow-hidden shadow-2xl bg-gradient-to-br from-black via-[#222] to-[#222] border border-[#74AA9C]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#74AA9C]/20 via-black/30 to-transparent pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#74AA9C] rounded-full"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-[#74AA9C] hover:text-white mb-6 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span>Back to Dashboard</span>
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-2xl flex items-center justify-center shadow-lg">
                    <Youtube className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent">
                      {studyBoard?.studyBoardName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#74AA9C]/80">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(studyBoard?.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{studyBoard?.video?.channel || studyBoard?.videoChannel}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{studyBoard?.video?.duration || studyBoard?.videoDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <a
                  href={studyBoard?.video?.url || studyBoard?.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white rounded-xl flex items-center space-x-2 hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Youtube className="w-5 h-5" />
                  <span>Watch Video</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="mb-10">
            <div className="flex space-x-2 bg-gradient-to-r from-black via-[#222] to-black p-2 rounded-2xl border border-[#74AA9C]/20 shadow-lg overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-7 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white shadow-xl scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-[#74AA9C]/10'
                  }`}
                  style={{ boxShadow: activeTab === tab.id ? '0 2px 16px #74AA9C44' : undefined }}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content area with glassmorphism */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl p-8 overflow-hidden shadow-2xl bg-gradient-to-br from-black via-[#222] to-[#222] border border-[#74AA9C]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#74AA9C]/10 via-black/30 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              {/* Existing tab content rendering logic */}
              {/* Summary Tab */}
              {activeTab === "summary" && studyBoard?.content?.summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Summary</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ul className="list-disc pl-4 space-y-2">
                      {studyBoard.content.summary.map((point, idx) => (
                        <li key={idx} className="text-gray-300 leading-relaxed">{point}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* TLDR Tab */}
              {activeTab === "tldr" && studyBoard?.content?.tldr && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-yellow-500/20 p-2 rounded-lg">
                      <Target className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h2 className="text-xl font-semibold">TLDR</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed text-lg">{studyBoard.content.tldr}</p>
                  </div>
                </motion.div>
              )}

              {/* Detailed Summary Tab */}
              {activeTab === "detailed" && studyBoard?.content?.detailedSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Detailed Summary</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{studyBoard.content.detailedSummary}</p>
                  </div>
                </motion.div>
              )}

              {/* Flashcards Tab */}
              {activeTab === "flashcards" && studyBoard?.content?.flashcards?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Flashcards</h2>
                  </div>
                  <div className="space-y-6">
                    {studyBoard.content.flashcards.map((card, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleCard(idx)}
                        className={`bg-gray-800 rounded-xl border border-gray-700 p-6 transition-all hover:bg-gray-750 cursor-pointer relative min-h-[150px] ${
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
                              ? "opacity-100 transform translate-y-0 bg-gray-800 border border-gray-700"
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
                </motion.div>
              )}

              {/* Quiz Tab */}
              {activeTab === "quiz" && studyBoard?.content?.quiz?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-orange-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Quiz Questions</h2>
                  </div>
                  <div className="space-y-6">
                    {studyBoard.content.quiz.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
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
                                  : "bg-gray-700 hover:bg-gray-600"
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
                            {question.explanation && (
                              <p className="text-sm text-gray-300">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
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

export default StudyboardPage;
