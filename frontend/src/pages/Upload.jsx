import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
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
  Star
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
    { id: "summary", label: "📝 Summary" },
    { id: "flashcards", label: "🔄 Flashcards" },
    { id: "quiz", label: "❓ Quiz" },
    { id: "important", label: "⭐ Important Points" },
    { id: "chat", label: "💬 Chat" },
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

      const chatResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/upload-and-chat`, {
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
                <h1 className="text-3xl font-bold mb-2">Document Study Board</h1>
                <p className="text-gray-400 mb-4">Upload a document to generate study materials</p>
              </div>
            </div>
          </div>

          {/* Upload Section - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} />
              Upload Document
            </h2>
            
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center mb-4">
              {documentFile ? (
                <div className="flex items-center justify-between bg-blue-500/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-400" size={24} />
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
                  <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-400 mb-2">Drag & drop your file here or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
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
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <CheckCircle2 className="text-green-400 mr-2" size={20} />
                  <span className="text-green-400">Document processed successfully! Study materials are now available.</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tabs - Only show if document has been uploaded */}
          {hasUploadedDocument && (
            <>
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
                    {renderSummary(studyBoard.content.summary)}
                  </motion.div>
                )}

                {/* Flashcards Tab */}
                {activeTab === "flashcards" && studyBoard?.content?.flashcards && studyBoard.content.flashcards.length > 0 && (
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
                            <p className="text-gray-200"><ReactMarkdown>{card.question}</ReactMarkdown></p>
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
                                const isCorrect = option.toLowerCase() === question.answer.toLowerCase();
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
                                  question.options[selectedAnswers[qIndex]]?.toLowerCase() === question.answer.toLowerCase()
                                    ? "bg-green-500/10 border-green-500/50"
                                    : "bg-red-500/10 border-red-500/50"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-white">
                                    Correct Answer: <div><ReactMarkdown>{question.answer}</ReactMarkdown></div>
                                  </p>
                                  <div className="text-sm">
                                    {selectedAnswers[qIndex] !== undefined && 
                                     question.options[selectedAnswers[qIndex]]?.toLowerCase() === question.answer.toLowerCase() ? (
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
                    className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-yellow-500/20 p-2 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Important Points</h2>
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

                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Chat with Document</h2>
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
                                  ? 'bg-purple-600 text-white'
                                  : message.type === 'error'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-gray-700 text-white'
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
                          <div className="bg-gray-700 text-white p-4 rounded-lg max-w-xs lg:max-w-md">
                            <div className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span>Processing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about your document..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={isProcessing}
                        />
                        
                        <button
                          onClick={handleSendMessage}
                          disabled={isProcessing || !inputMessage.trim()}
                          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
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