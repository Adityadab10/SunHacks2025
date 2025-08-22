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
    if (score >= 8) return 'text-green-400 bg-green-400/20 border-green-400/30';
    if (score >= 6) return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
    return 'text-red-400 bg-red-400/20 border-red-400/30';
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
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Active Recall
            </span>
          </h2>
          <p className="text-gray-400">Test your understanding with the Feynman Technique</p>
        </motion.div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-4">Questions Not Available</h3>
          <p className="text-gray-400 mb-6">
            Active recall questions couldn't be loaded. Please try processing the video again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Active Recall
          </span>
        </h2>
        <p className="text-gray-400">Explain concepts in your own words using the Feynman Technique</p>
      </motion.div>

      {/* Questions Progress */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <div className="flex space-x-2">
            {questions.map((question, index) => {
              const status = getQuestionStatus(question.id);
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    index === currentQuestionIndex
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : status === 'completed'
                      ? 'bg-green-600 border-green-600 text-white'
                      : status === 'answered'
                      ? 'bg-yellow-600 border-yellow-600 text-white'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(questionGrades).length / questions.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">
              {questions[currentQuestionIndex]?.question}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              questions[currentQuestionIndex]?.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              questions[currentQuestionIndex]?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {questions[currentQuestionIndex]?.difficulty}
            </span>
          </div>
          <button
            onClick={() => speakQuestion(questions[currentQuestionIndex]?.question)}
            className={`p-2 rounded-lg transition-colors ${
              speaking ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Answer Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Your Answer</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={startRecording}
                disabled={questionGrades[questions[currentQuestionIndex]?.id]}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  questionGrades[questions[currentQuestionIndex]?.id]
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Stop' : 'Record'}</span>
              </button>
              <button
                onClick={() => toggleEdit(questions[currentQuestionIndex]?.id)}
                disabled={questionGrades[questions[currentQuestionIndex]?.id] && !editingAnswer[questions[currentQuestionIndex]?.id]}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {editingAnswer[questions[currentQuestionIndex]?.id] || !questionGrades[questions[currentQuestionIndex]?.id] ? (
            <textarea
              value={answers[questions[currentQuestionIndex]?.id] || ''}
              onChange={(e) => handleAnswerEdit(questions[currentQuestionIndex]?.id, e.target.value)}
              placeholder="Type or record your explanation here..."
              disabled={gradingQuestions[questions[currentQuestionIndex]?.id]}
              className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none disabled:opacity-50"
            />
          ) : (
            <div className="min-h-32 p-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-300">
              {answers[questions[currentQuestionIndex]?.id]}
            </div>
          )}

          {isRecording && (
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-sm">Recording... Speak clearly</span>
            </div>
          )}
        </div>

        {/* Submit/Retake Button */}
        <div className="flex justify-center">
          {questionGrades[questions[currentQuestionIndex]?.id] ? (
            <button
              onClick={() => retakeQuestion(questions[currentQuestionIndex]?.id)}
              className="flex items-center space-x-2 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Question</span>
            </button>
          ) : (
            <button
              onClick={() => submitAnswer(questions[currentQuestionIndex]?.id)}
              disabled={gradingQuestions[questions[currentQuestionIndex]?.id] || !answers[questions[currentQuestionIndex]?.id]?.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {gradingQuestions[questions[currentQuestionIndex]?.id] ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grading...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
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
            className="mt-6 p-6 bg-gray-800 rounded-xl border border-gray-700"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Your Score</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {['clarity', 'understanding', 'accuracy'].map((criteria) => {
                const score = questionGrades[questions[currentQuestionIndex]?.id]?.[criteria] || 0;
                const Icon = getGradeIcon(score);
                
                return (
                  <div
                    key={criteria}
                    className={`p-4 rounded-lg border ${getGradeColor(score)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{criteria}</span>
                      </div>
                      <span className="text-lg font-bold">{score}/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {questionFeedback[questions[currentQuestionIndex]?.id] && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Feedback</h5>
                <p className="text-gray-300 text-sm">{questionFeedback[questions[currentQuestionIndex]?.id]}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={resetSession}
          className="flex items-center space-x-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All</span>
        </button>

        <button
          onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Overall Progress Summary */}
      {Object.keys(questionGrades).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Progress Summary ({Object.keys(questionGrades).length}/{questions.length} completed)
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
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${getGradeColor(avgScore)} ${
                    currentQuestionIndex === index ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">Q{index + 1}</span>
                      <span className="text-sm opacity-75 truncate max-w-md">{question.question}</span>
                    </div>
                    <span className="text-lg font-bold">{avgScore}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default YTActive;
