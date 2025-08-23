import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
import StoryMode from '../components/StoryMode';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
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
  CheckCircle2,
  Send,
  FileText,
  X,
  Upload,
  Star,
  Headphones
} from 'lucide-react';

const StudyboardPage = () => {
  const navigate = useNavigate();
  const { mongoUid } = useUser();
  const [studyBoard, setStudyBoard] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  
  // ChatGPT-like interface states
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const fileInputRef = useRef(null);

  const TABS = [
    { id: "summary", label: "📝 Summary", icon: BookOpen },
    { id: "flashcards", label: "🔄 Flashcards", icon: BrainCircuit },
    { id: "quiz", label: "❓ Quiz", icon: Target },
    { id: "important", label: "⭐ Important Points", icon: Star },
    { id: "storymode", label: "🎧 Story Mode", icon: Headphones },
    { id: "chat", label: "💬 Chat", icon: Send },
  ];

  // Handle flashcard toggle
  const toggleCard = (cardIndex) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardIndex]: !prev[cardIndex]
    }));
  };

  // Handle quiz answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (showExplanations[questionIndex]) return; // Prevent changing answer after explanation is shown
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));

    // Show explanation after selecting answer with a small delay for better UX
    setTimeout(() => {
      setShowExplanations(prev => ({
        ...prev,
        [questionIndex]: true
      }));
    }, 300);
  };

  // Handle document upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, DOCX, or PPTX file');
        e.target.value = '';
        return;
      }
      setDocumentFile(file);
    }
  };

  const clearFile = () => {
    setDocumentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process document for study materials
  const processDocument = async () => {
    if (!documentFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('message', 'Generate study materials from this document');

const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/flashcards`, {
  method: 'POST',
  body: formData,
});


      if (response.ok) {
        const responseData = await response.json();

        if (responseData.status === 'success') {
          const result = responseData;
          console.log("Full result:", result);
          
          // Ensure summary is in array format
          let summaryArray = [];
          if (result.summary) {
            if (Array.isArray(result.summary)) {
              summaryArray = result.summary;
            } else if (typeof result.summary === 'string') {
              summaryArray = result.summary.split('\n').filter(point => point.trim());
            }
          }

          // Ensure flashcards is an array
          const flashcardsArray = Array.isArray(result.flashcards) 
            ? result.flashcards 
            : [];
            
          // Convert quiz object to array format - FIXED
          let quizArray = [];
          if (result.quiz && typeof result.quiz === 'object') {
            // Check if it's already an array format
            if (Array.isArray(result.quiz)) {
              quizArray = result.quiz;
            } else {
              // Convert numbered properties to array
              quizArray = Object.keys(result.quiz)
                .filter(key => key.startsWith('question_'))
                .map((key, index) => {
                  const questionNum = index + 1;
                  const questionData = {
                    question: result.quiz[`question_${questionNum}`],
                    options: result.quiz[`options_${questionNum}`] || [],
                    answer: result.quiz[`answer_${questionNum}`],
                    explanation: result.quiz[`explanation_${questionNum}`] || ''
                  };
                  return questionData.question ? questionData : null;
                })
                .filter(Boolean);
            }
          }

          console.log("Processed quiz array:", quizArray);

          // Extract important points
          let importantPoints = [];
          if (result.important && Array.isArray(result.important)) {
            importantPoints = result.important;
          }

          setStudyBoard({
            studyBoardName: documentFile.name,
            createdAt: new Date().toISOString(),
            content: {
              summary: summaryArray,
              flashcards: flashcardsArray,
              quiz: quizArray,
              importantPoints: importantPoints
            }
          });
          setHasUploadedDocument(true);
          
          // Add success message to chat
          const successMessage = {
            id: Date.now(),
            type: 'ai',
            content: `I've processed your document "${documentFile.name}" and generated study materials. Check the tabs above to explore them!`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMessage]);
        } else {
          throw new Error(responseData.detail || 'Failed to process document');
        }
      } else {
        throw new Error('Failed to process document');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setError('Failed to process document. Please try again.');
      
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: 'Sorry, I encountered an error processing your document.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sending message and processing document
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !documentFile) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      document: documentFile ? documentFile.name : null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // If there's a document but it hasn't been processed yet, process it first
      if (documentFile && !hasUploadedDocument) {
        await processDocument();
      }

      // Send message to chat endpoint
      const chatFormData = new FormData();
      if (documentFile) {
        chatFormData.append('file', documentFile);
      }
      chatFormData.append('message', inputMessage);
      chatFormData.append('teacher', 'Anil Deshmukh'); // Default teacher

      const chatResponse = await fetch(`${env.VITE_SERVER_URL}/upload-and-chat`, {
  method: 'POST',
  body: chatFormData,
});


      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: chatData.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response from AI');
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to render summary content with markdown
  const renderSummary = (summary) => {
    if (Array.isArray(summary)) {
      return (
        <ul className="list-disc pl-4 space-y-2">
          {summary.map((point, idx) => (
            <li key={idx} className="text-gray-300 leading-relaxed">
              <ReactMarkdown>{point}</ReactMarkdown>
            </li>
          ))}
        </ul>
      );
    } else if (typeof summary === 'string') {
      return (
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      );
    } else {
      return <p className="text-gray-500">No summary available</p>;
    }
  };

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
          {/* Header Section - Profile-style glassmorphism */}
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
                className="flex items-center space-x-2 text-[#74AA9C]/80 hover:text-[#74AA9C] mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] p-4 rounded-2xl shadow-lg">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent drop-shadow-lg">
                    Document Study Board
                  </h1>
                  <p className="text-[#74AA9C]/80 text-lg mb-4 font-mono">Upload a document to generate study materials</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upload Section - Profile-style glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center text-[#74AA9C]">
              <Upload className="mr-2" size={20} />
              Upload Document
            </h2>
            
            <div className="border-2 border-dashed border-[#74AA9C]/50 rounded-lg p-6 text-center mb-4 bg-[#74AA9C]/5">
              {documentFile ? (
                <div className="flex items-center justify-between bg-[#74AA9C]/20 p-4 rounded-lg border border-[#74AA9C]/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-[#74AA9C]" size={24} />
                    <div className="text-left">
                      <p className="text-white font-medium">{documentFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {getFileTypeName(documentFile.type)} • {formatFileSize(documentFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto text-[#74AA9C] mb-3" size={32} />
                  <p className="text-gray-400 mb-2">Drag & drop your file here or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-3">PDF, DOCX, and PPTX files supported</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {documentFile && !hasUploadedDocument && (
              <button
                onClick={processDocument}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-300 shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2" size={20} />
                    <span>Generate Study Materials</span>
                  </>
                )}
              </button>
            )}
            
            {hasUploadedDocument && (
              <div className="bg-[#74AA9C]/10 border border-[#74AA9C]/30 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <CheckCircle2 className="text-[#74AA9C] mr-2" size={20} />
                  <span className="text-[#74AA9C]">Document processed successfully! Study materials are now available.</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tabs - Profile-style navigation */}
          {hasUploadedDocument && (
            <>
              <div className="mb-10">
                <div className="flex space-x-2 bg-gradient-to-r from-black via-[#222] to-black p-2 rounded-2xl border border-[#74AA9C]/20 shadow-lg overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center space-x-2 px-7 py-3 rounded-xl font-semibold transition-all duration-200 overflow-hidden whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white shadow-xl scale-105'
                          : 'text-gray-400 hover:text-white hover:bg-[#74AA9C]/10'
                      }`}
                      style={{ boxShadow: activeTab === tab.id ? '0 2px 16px #74AA9C44' : undefined }}
                    >
                      <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-[#74AA9C]'}`} />
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

              {/* Study Content - Profile-style cards */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-8"
              >
                {/* Summary Tab */}
                {activeTab === "summary" && studyBoard?.content?.summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-[#222] border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-[#74AA9C]/20 p-2 rounded-lg">
                        <BookOpen className="w-5 h-5 text-[#74AA9C]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[#74AA9C]">Summary</h2>
                    </div>
                    {renderSummary(studyBoard.content.summary)}
                  </motion.div>
                )}

                {/* Flashcards Tab */}
                {activeTab === "flashcards" && studyBoard?.content?.flashcards && studyBoard.content.flashcards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-[#222] border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-[#74AA9C]/20 p-2 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-[#74AA9C]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[#74AA9C]">Flashcards</h2>
                    </div>
                    <div className="space-y-6">
                      {studyBoard.content.flashcards.map((card, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleCard(idx)}
                          className={`bg-gradient-to-br from-[#222] to-[#111] border border-[#74AA9C]/30 rounded-xl p-6 transition-all hover:border-[#74AA9C]/50 cursor-pointer relative min-h-[150px] shadow-lg ${
                            flippedCards[idx] ? "shadow-xl scale-105" : ""
                          }`}
                        >
                          <div
                            className={`transition-all duration-300 ${
                              flippedCards[idx] ? "opacity-0" : "opacity-100"
                            }`}
                          >
                            <h3 className="text-xl font-semibold mb-3 text-[#74AA9C]">Question:</h3>
                            <p className="text-gray-200"><ReactMarkdown>{card.question}</ReactMarkdown></p>
                          </div>

                          <div
                            className={`absolute inset-0 p-6 transition-all duration-300 rounded-xl ${
                              flippedCards[idx]
                                ? "opacity-100 transform translate-y-0 bg-gradient-to-br from-[#222] to-[#111] border border-[#74AA9C]/30"
                                : "opacity-0 transform translate-y-4"
                            }`}
                          >
                            <h3 className="text-xl font-semibold mb-3 text-[#74AA9C]">
                              Answer:
                            </h3>
                            <p className="text-gray-200"><ReactMarkdown>{card.answer}</ReactMarkdown></p>
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
{activeTab === "quiz" && studyBoard?.content?.quiz && studyBoard.content.quiz.length > 0 && (
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
      {studyBoard.content.quiz.map((question, qIndex) => {
        const optionLabels = ['A', 'B', 'C', 'D'];
        
        return (
          <div
            key={qIndex}
            className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              {qIndex + 1}. <ReactMarkdown>{question.question}</ReactMarkdown>
            </h3>
            <div className="space-y-3">
              {question.options && question.options.map((option, oIndex) => {
                // FIXED: Compare option letter (A, B, C, D) with the answer letter
                const isCorrect = optionLabels[oIndex] === question.answer;
                const isSelected = selectedAnswers[qIndex] === oIndex;
                const showResult = showExplanations[qIndex];
                
                return (
                  <button
                    key={oIndex}
                    onClick={() => handleAnswerSelect(qIndex, oIndex)}
                    disabled={showExplanations[qIndex]}
                    className={`w-full text-left p-4 rounded-lg text-white transition-colors border-2 ${
                      showResult
                        ? isCorrect
                          ? "bg-green-500/20 border-green-500 text-green-100"
                          : isSelected
                          ? "bg-red-500/20 border-red-500 text-red-100"
                          : "bg-gray-700 border-gray-600"
                        : isSelected
                        ? "bg-blue-500/20 border-blue-500"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-semibold mr-3 text-sm bg-gray-600 px-2 py-1 rounded">
                          {optionLabels[oIndex]}
                        </span>
                        <span className="text-left"><ReactMarkdown>{option}</ReactMarkdown></span>
                      </div>
                      {showResult && (
                        <div className="flex items-center">
                          {isCorrect && (
                            <span className="text-green-400 font-bold">✓ Correct</span>
                          )}
                          {!isCorrect && isSelected && (
                            <span className="text-red-400 font-bold">✗ Wrong</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showExplanations[qIndex] && (
              <div
                className={`mt-4 p-4 rounded-lg border-2 ${
                  selectedAnswers[qIndex] !== undefined && 
                  optionLabels[selectedAnswers[qIndex]] === question.answer
                    ? "bg-green-500/10 border-green-500/50"
                    : "bg-red-500/10 border-red-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">
                    Correct Answer: {question.answer} - <ReactMarkdown>{question.options[optionLabels.indexOf(question.answer)]}</ReactMarkdown>
                  </p>
                  <div className="text-sm">
                    {selectedAnswers[qIndex] !== undefined && 
                     optionLabels[selectedAnswers[qIndex]] === question.answer ? (
                      <span className="text-green-400 font-semibold">✓ You got it right!</span>
                    ) : (
                      <span className="text-red-400 font-semibold">✗ Better luck next time!</span>
                    )}
                  </div>
                </div>
                {question.explanation && (
                  <p className="text-sm text-gray-300 mt-2 p-3 bg-gray-800/50 rounded">
                    <strong>Explanation:</strong> <div><ReactMarkdown>{question.explanation}</ReactMarkdown></div>
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </motion.div>
)}

                {/* Important Points Tab */}
                {activeTab === "important" && studyBoard?.content?.importantPoints && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-[#74AA9C]/20 p-2 rounded-lg">
                        <Star className="w-5 h-5 text-[#74AA9C]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[#74AA9C]">Important Points</h2>
                    </div>
                    {studyBoard.content.importantPoints.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-2">
                        {studyBoard.content.importantPoints.map((point, idx) => (
                          <li key={idx} className="text-gray-300 leading-relaxed">
                            <ReactMarkdown>{point}</ReactMarkdown>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No important points available</p>
                    )}
                  </motion.div>
                )}

                {/* Story Mode Tab */}
                {activeTab === "storymode" && (
                  <StoryMode 
                    studyBoard={studyBoard} 
                    documentFile={documentFile} 
                  />
                )}

                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-[#74AA9C]/20 p-2 rounded-lg">
                        <Send className="w-5 h-5 text-[#74AA9C]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[#74AA9C]">Chat with Document</h2>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-96 overflow-y-auto mb-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>Start a conversation about your document</p>
                          <p className="text-sm">Ask questions about the content</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md p-4 rounded-lg ${
                                message.type === 'user'
                                  ? 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white'
                                  : message.type === 'error'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-gray-700/50 text-white border border-gray-600/30'
                              }`}
                            >
                              {message.document && (
                                <div className="flex items-center text-xs mb-2 opacity-80">
                                  <FileText className="w-3 h-3 mr-1" />
                                  <span>{message.document}</span>
                                </div>
                              )}
                              <div className="whitespace-pre-wrap">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700/50 text-white p-4 rounded-lg max-w-xs lg:max-w-md border border-gray-600/30">
                            <div className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span>Processing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="border border-[#74AA9C]/30 rounded-lg p-3 bg-gradient-to-br from-[#222]/50 to-[#111]/50">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about your document..."
                          className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#74AA9C]/50 focus:border-[#74AA9C]/50"
                          disabled={isProcessing}
                        />
                        
                        <button
                          onClick={handleSendMessage}
                          disabled={isProcessing || !inputMessage.trim()}
                          className="p-2 bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white rounded-lg hover:from-[#5a8a7d] hover:to-[#74AA9C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Custom Styles for shimmer and glass */}
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

// Helper functions
const getFileTypeName = (type) => {
  if (type === 'application/pdf') return 'PDF';
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
  if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX';
  return 'File';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default StudyboardPage;