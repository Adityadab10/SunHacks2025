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
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{studyBoard?.studyBoardName}</h1>
                <p className="text-gray-400 mb-4">AI-generated study material</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(studyBoard?.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Youtube className="w-4 h-4" />
                    <span>Based on video content</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Source Video</h2>
            <div className="flex items-start space-x-4">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <Youtube className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-2">{studyBoard?.video?.title || studyBoard?.videoTitle}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{studyBoard?.video?.channel || studyBoard?.videoChannel}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{studyBoard?.video?.duration || studyBoard?.videoDuration}</span>
                  </div>
                </div>
                <a
                  href={studyBoard?.video?.url || studyBoard?.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <span>Watch Video</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

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

          {/* Study Content */}
          <div className="grid gap-8">
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
        </div>
      </div>
    </div>
  );
};

export default StudyboardPage;
