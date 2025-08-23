import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import {
  Mic, MicOff, Play, Pause, RotateCcw, Edit3, Save, 
  CheckCircle, AlertCircle, Brain, Target, Lightbulb,
  MessageSquare, Volume2, VolumeX, Loader2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const YTActive = ({ preloadedData, videoData, isPreloaded = false }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState({});
  const [questionGrades, setQuestionGrades] = useState({}); // Changed to store grades per question
  const [questionFeedback, setQuestionFeedback] = useState({}); // Changed to store feedback per question
  const [gradingQuestions, setGradingQuestions] = useState({}); // Track which questions are being graded
  const [transcript, setTranscript] = useState('');

  const { speak, cancel, speaking, supported, voices } = useSpeechSynthesis();
  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result) => {
      const questionId = questions[currentQuestionIndex]?.id;
      if (questionId) {
        setAnswers(prev => ({
          ...prev,
          [questionId]: result
        }));
      }
    },
  });

  // Load questions and transcript from preloaded data
  useEffect(() => {
    if (preloadedData?.questions) {
      console.log('Loading questions from preloadedData:', preloadedData.questions);
      setQuestions(preloadedData.questions);
    }
    
    if (preloadedData?.transcript) {
      setTranscript(preloadedData.transcript);
    } else if (preloadedData?.videoData?.transcript) {
      setTranscript(preloadedData.videoData.transcript);
    } else if (videoData?.transcript) {
      setTranscript(videoData.transcript);
    }
  }, [preloadedData, videoData]);

  const startRecording = () => {
    if (listening) {
      stop();
      setIsRecording(false);
    } else {
      listen({ continuous: true });
      setIsRecording(true);
    }
  };

  const speakQuestion = (question) => {
    if (speaking) {
      cancel();
    } else {
      speak({ text: question });
    }
  };

  const handleAnswerEdit = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const toggleEdit = (questionId) => {
    setEditingAnswer(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const submitAnswer = async (questionId) => {
    const answer = answers[questionId]?.trim();
    
    if (!answer) {
      toast.error('Please provide an answer before submitting');
      return;
    }

    setGradingQuestions(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const question = questions.find(q => q.id === questionId);
      
      const response = await fetch('http://localhost:5000/api/youtube/active-recall/grade-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript || 'No transcript available',
          question: question.question,
          answer: answer,
          difficulty: question.difficulty,
          videoTitle: videoData?.video?.title || preloadedData?.videoData?.video?.title || 'YouTube Video'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setQuestionGrades(prev => ({
          ...prev,
          [questionId]: data.data
        }));
        setQuestionFeedback(prev => ({
          ...prev,
          [questionId]: data.data.feedback
        }));
        toast.success('Answer graded successfully!');
      } else {
        throw new Error(data.error || 'Failed to grade answer');
      }
    } catch (error) {
      console.error('Error grading answer:', error);
      toast.error('Failed to grade answer. Please try again.');
    } finally {
      setGradingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const retakeQuestion = (questionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: '' }));
    setQuestionGrades(prev => {
      const newGrades = { ...prev };
      delete newGrades[questionId];
      return newGrades;
    });
    setQuestionFeedback(prev => {
      const newFeedback = { ...prev };
      delete newFeedback[questionId];
      return newFeedback;
    });
    setEditingAnswer(prev => ({ ...prev, [questionId]: true }));
  };

  const resetSession = () => {
    setAnswers({});
    setQuestionGrades({});
    setQuestionFeedback({});
    setCurrentQuestionIndex(0);
    setEditingAnswer({});
    setGradingQuestions({});
  };

  const getGradeColor = (score) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    if (score >= 6) return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    return 'text-red-400 bg-red-400/10 border-red-400/30';
  };

  const getGradeIcon = (score) => {
    if (score >= 8) return CheckCircle;
    if (score >= 6) return AlertCircle;
    return AlertCircle;
  };

  const getQuestionStatus = (questionId) => {
    if (questionGrades[questionId]) return 'completed';
    if (answers[questionId]?.trim()) return 'answered';
    return 'unanswered';
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-black px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Active Recall
            </h2>
            <p className="text-gray-300 text-lg">Test your understanding with the Feynman Technique</p>
          </motion.div>

          <div className="bg-gray-900/80 rounded-3xl p-12 border border-gray-800/50 text-center backdrop-blur-sm">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#74AA9C]/20 flex items-center justify-center">
              <Brain className="w-12 h-12 text-[#74AA9C]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">Questions Not Available</h3>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
              Active recall questions couldn't be loaded. Please try processing the video again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-4 text-white">
            Active Recall
          </h2>
          <p className="text-gray-300 text-lg">Explain concepts in your own words using the Feynman Technique</p>
        </motion.div>

        {/* Questions Progress */}
        <div className="bg-gray-900/80 rounded-3xl p-8 border border-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            <div className="flex space-x-3">
              {questions.map((question, index) => {
                const status = getQuestionStatus(question.id);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center font-medium ${
                      index === currentQuestionIndex
                        ? 'bg-[#74AA9C] border-[#74AA9C] text-black shadow-lg shadow-[#74AA9C]/25'
                        : status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : status === 'answered'
                        ? 'bg-amber-500 border-amber-500 text-black'
                        : 'border-gray-600 text-gray-400 hover:border-[#74AA9C]/50 hover:text-[#74AA9C]'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="w-full bg-gray-800/50 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#74AA9C] to-[#74AA9C]/80 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{
                width: `${(Object.keys(questionGrades).length / questions.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-gray-900/80 rounded-3xl p-8 border border-gray-800/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1 pr-6">
              <h3 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
                {questions[currentQuestionIndex]?.question}
              </h3>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                questions[currentQuestionIndex]?.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                questions[currentQuestionIndex]?.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {questions[currentQuestionIndex]?.difficulty}
              </span>
            </div>
            <button
              onClick={() => speakQuestion(questions[currentQuestionIndex]?.question)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                speaking ? 'bg-[#74AA9C] text-black shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-[#74AA9C] hover:bg-gray-800'
              }`}
            >
              {speaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          {/* Answer Input */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">Your Answer</h4>
              <div className="flex items-center space-x-3">
                <button
                  onClick={startRecording}
                  disabled={questionGrades[questions[currentQuestionIndex]?.id]}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    questionGrades[questions[currentQuestionIndex]?.id]
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                      : 'bg-[#74AA9C] hover:bg-[#74AA9C]/90 text-black shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                </button>
                <button
                  onClick={() => toggleEdit(questions[currentQuestionIndex]?.id)}
                  disabled={questionGrades[questions[currentQuestionIndex]?.id] && !editingAnswer[questions[currentQuestionIndex]?.id]}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700/50 disabled:text-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-medium"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Edit Answer</span>
                </button>
              </div>
            </div>

            {editingAnswer[questions[currentQuestionIndex]?.id] || !questionGrades[questions[currentQuestionIndex]?.id] ? (
              <textarea
                value={answers[questions[currentQuestionIndex]?.id] || ''}
                onChange={(e) => handleAnswerEdit(questions[currentQuestionIndex]?.id, e.target.value)}
                placeholder="Type or record your explanation here..."
                disabled={gradingQuestions[questions[currentQuestionIndex]?.id]}
                className="w-full h-40 p-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#74AA9C] focus:ring-2 focus:ring-[#74AA9C]/20 resize-none disabled:opacity-50 text-lg leading-relaxed"
              />
            ) : (
              <div className="min-h-40 p-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl text-gray-200 text-lg leading-relaxed">
                {answers[questions[currentQuestionIndex]?.id]}
              </div>
            )}

            {isRecording && (
              <div className="flex items-center justify-center space-x-3 text-red-400 bg-red-400/10 rounded-xl p-4">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                <span className="font-medium">Recording... Speak clearly</span>
              </div>
            )}
          </div>

          {/* Submit/Retake Button */}
          <div className="flex justify-center mt-8">
            {questionGrades[questions[currentQuestionIndex]?.id] ? (
              <button
                onClick={() => retakeQuestion(questions[currentQuestionIndex]?.id)}
                className="flex items-center space-x-3 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retake Question</span>
              </button>
            ) : (
              <button
                onClick={() => submitAnswer(questions[currentQuestionIndex]?.id)}
                disabled={gradingQuestions[questions[currentQuestionIndex]?.id] || !answers[questions[currentQuestionIndex]?.id]?.trim()}
                className="flex items-center space-x-3 px-8 py-4 bg-[#74AA9C] hover:bg-[#74AA9C]/90 disabled:bg-gray-600 disabled:text-gray-400 text-black rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {gradingQuestions[questions[currentQuestionIndex]?.id] ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Grading Answer...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Individual Question Result */}
          {questionGrades[questions[currentQuestionIndex]?.id] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50"
            >
              <h4 className="text-xl font-semibold text-white mb-6">Your Score</h4>
              <div className="grid grid-cols-3 gap-6 mb-6">
                {['clarity', 'understanding', 'accuracy'].map((criteria) => {
                  const score = questionGrades[questions[currentQuestionIndex]?.id]?.[criteria] || 0;
                  const Icon = getGradeIcon(score);
                  
                  return (
                    <div
                      key={criteria}
                      className={`p-6 rounded-xl border ${getGradeColor(score)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold capitalize">{criteria}</span>
                        </div>
                        <span className="text-2xl font-bold">{score}/10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {questionFeedback[questions[currentQuestionIndex]?.id] && (
                <div className="bg-gray-700/50 rounded-xl p-6">
                  <h5 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-[#74AA9C]" />
                    <span>Feedback</span>
                  </h5>
                  <p className="text-gray-200 leading-relaxed">{questionFeedback[questions[currentQuestionIndex]?.id]}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-600 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-medium"
          >
            Previous Question
          </button>

          <button
            onClick={resetSession}
            className="flex items-center space-x-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset All Answers</span>
          </button>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-600 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-medium"
          >
            Next Question
          </button>
        </div>

        {/* Overall Progress Summary */}
        {Object.keys(questionGrades).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/80 rounded-3xl p-8 border border-gray-800/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
              <Target className="w-6 h-6 text-[#74AA9C]" />
              <span>Progress Summary ({Object.keys(questionGrades).length}/{questions.length} completed)</span>
            </h3>
            <div className="grid gap-4">
              {questions.map((question, index) => {
                const grade = questionGrades[question.id];
                if (!grade) return null;
                
                const avgScore = Math.round((grade.clarity + grade.understanding + grade.accuracy) / 3);
                const Icon = getGradeIcon(avgScore);
                
                return (
                  <div
                    key={question.id}
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 ${getGradeColor(avgScore)} ${
                      currentQuestionIndex === index ? 'ring-2 ring-[#74AA9C] ring-offset-2 ring-offset-black' : 'hover:scale-[1.02]'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-current bg-opacity-20 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg">Q{index + 1}</span>
                          <span className="text-white/90 truncate max-w-md">{question.question}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">{avgScore}</span>
                        <span className="text-white/70">/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default YTActive;