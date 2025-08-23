import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import MainSidebar from '../components/Sidebar';
import {
  Target, TrendingUp, Clock, Brain, CheckCircle, ArrowRight,
  BarChart3, PieChart, Calendar, Zap, BookOpen, Users,
  Lightbulb, Trophy, Star, ChevronRight, Play, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const StudyFlow = () => {
  const { mongoUid, firebaseUid } = useUser();
  
  console.log('🔧 StudyFlow component mounted');
  console.log('🆔 User IDs:', { mongoUid, firebaseUid });
  
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('3 months');
  const [currentLevel, setCurrentLevel] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('🆔 mongoUid in useEffect:', mongoUid);
    
    if (mongoUid) {
      console.log('✅ mongoUid exists, fetching analytics...');
      fetchAnalytics();
    } else {
      console.log('❌ mongoUid not available yet');
    }
  }, [mongoUid]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`http://localhost:5000/api/flow/analytics/${mongoUid}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const generateFlow = async () => {
    console.log('🚀 generateFlow function called');
    console.log('📝 Current goal:', goal);
    console.log('📝 Goal trimmed:', goal.trim());
    
    if (!goal.trim()) {
      console.log('❌ Goal validation failed - empty goal');
      toast.error('Please enter your learning goal');
      return;
    }

    console.log('✅ Goal validation passed');
    console.log('🆔 Using mongoUid:', mongoUid);
    console.log('📦 Request payload:', { userId: mongoUid, goal: goal.trim(), timeframe, currentLevel });

    setLoading(true);
    console.log('⏳ Loading state set to true');
    
    try {
      const apiUrl = 'http://localhost:5000/api/flow/generate-flow';
      console.log('🌐 Making request to:', apiUrl);
      
      const requestBody = {
        userId: mongoUid,
        goal: goal.trim(),
        timeframe,
        currentLevel
      };
      
      console.log('📤 Sending request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 Response received');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response statusText:', response.statusText);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response type:', response.type);
      console.log('📊 Response url:', response.url);

      if (!response.ok) {
        console.log('❌ Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log('✅ Response is ok, parsing JSON...');
      const data = await response.json();
      console.log('📦 Parsed response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('🎉 Success! Setting flow data...');
        console.log('📊 Flow data structure:', {
          hasFlowSteps: !!data.data.flowSteps,
          flowStepsLength: data.data.flowSteps?.length,
          hasAnalytics: !!data.data.analytics,
          hasUserMetrics: !!data.data.userMetrics
        });
        
        setFlowData(data.data);
        setShowGoalForm(false);
        toast.success('Study flow generated successfully!');
        console.log('✅ State updated successfully');
      } else {
        console.log('❌ API returned success: false');
        console.log('❌ Error from API:', data.error);
        toast.error(data.error || 'Failed to generate study flow');
      }
    } catch (error) {
      console.error('❌ Fetch error occurred:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network error - check if backend is running');
        toast.error('Cannot connect to server. Is the backend running?');
      } else if (error.message.includes('404')) {
        console.error('🔍 Route not found error');
        toast.error('API route not found. Check backend routes.');
      } else {
        toast.error('Failed to generate study flow: ' + error.message);
      }
    } finally {
      setLoading(false);
      console.log('⏳ Loading state set to false');
    }
  };

  const renderGoalForm = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-8 max-w-md w-full border border-[#74AA9C]/30">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] p-3 rounded-xl inline-block mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Set Your Learning Goal</h3>
          <p className="text-gray-400">Tell us what you want to achieve and we'll create a personalized path</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">What do you want to learn or improve?</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="E.g., Master Data Structures and Algorithms, Learn React Development, Improve Physics concepts..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#74AA9C] transition-colors resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#74AA9C] transition-colors"
            >
              <option value="1 month">1 Month</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Current Level</label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#74AA9C] transition-colors"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowGoalForm(false)}
              className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateFlow}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate Flow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderFlowStep = (step, index) => (
    <motion.div
      key={step.stepNumber}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <div 
        className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{ borderColor: step.color || colors[index % colors.length] }}
      >
        <div className="flex items-start space-x-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: step.color || colors[index % colors.length] }}
          >
            {step.stepNumber}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-gray-400 mb-4">{step.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-[#74AA9C]" />
                <span className="text-gray-300">Duration: {step.duration}</span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Key Activities:</h4>
                <ul className="space-y-1">
                  {step.keyActivities.map((activity, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-2">Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {step.resources.map((resource, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {index < flowData.flowSteps.length - 1 && (
        <div className="flex justify-center my-4">
          <ArrowRight className="w-6 h-6 text-[#74AA9C]" />
        </div>
      )}
    </motion.div>
  );

  const renderAnalytics = () => {
    if (loadingAnalytics) {
      return (
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!analytics) return null;

    const subjectData = Object.entries(analytics.learningPatterns.subjects).map(([name, value]) => ({
      name,
      value,
      color: colors[Object.keys(analytics.learningPatterns.subjects).indexOf(name) % colors.length]
    }));

    return (
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30">
          <h3 className="text-xl font-bold text-white mb-6">Learning Activity Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timelineData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value, name) => [value, name === 'activities' ? 'Activities' : 'Est. Time (min)']}
                />
                <Line 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#74AA9C" 
                  strokeWidth={3}
                  dot={{ fill: '#74AA9C', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="estimatedTime" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30">
          <h3 className="text-xl font-bold text-white mb-6">Subject Distribution</h3>
          <div className="h-64">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={subjectData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Start learning to see subject distribution
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#111] to-[#222] text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d]">
                Smart Study Flow
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              AI-powered personalized learning paths based on your study history and goals
            </p>
          </motion.div>

          {/* Analytics Section */}
          {analytics && renderAnalytics()}

          {/* Quick Stats */}
          {analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Total Activities</p>
                    <p className="text-3xl font-bold text-white">{analytics.summary.totalActivities}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Consistency</p>
                    <p className="text-3xl font-bold text-white">{Math.round(analytics.summary.consistency)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Progress Rate</p>
                    <p className="text-xl font-bold text-white">{analytics.summary.progressRate}</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-200 text-sm">Weekly Average</p>
                    <p className="text-3xl font-bold text-white">{analytics.summary.averageActivitiesPerWeek}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Generate Flow Button */}
          {!flowData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-12 border border-[#74AA9C]/30">
                <div className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] p-4 rounded-2xl inline-block mb-6">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Ready to Level Up Your Learning?</h3>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Let our AI analyze your learning history and create a personalized 6-step study flow tailored to your goals.
                </p>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center space-x-3 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  <span>Generate My Study Flow</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Flow Steps */}
          {flowData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-6 border border-green-500/30">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Your Personalized Learning Journey</h3>
                </div>
                <p className="text-gray-300">{flowData.motivationalMessage}</p>
              </div>

              {/* Flow Steps */}
              <div className="space-y-6">
                {flowData.flowSteps.map((step, index) => renderFlowStep(step, index))}
              </div>

              {/* Analytics Summary */}
              {flowData.analytics && (
                <div className="grid md:grid-cols-2 gap-6 mt-12">
                  <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30">
                    <h3 className="text-xl font-bold text-white mb-4">Your Strengths</h3>
                    <div className="space-y-2">
                      {flowData.analytics.strengthAreas.map((area, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-300">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-black via-[#222] to-[#222] rounded-2xl p-6 border border-[#74AA9C]/30">
                    <h3 className="text-xl font-bold text-white mb-4">Areas to Improve</h3>
                    <div className="space-y-2">
                      {flowData.analytics.improvementAreas.map((area, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <div className="text-center pt-8">
                <button
                  onClick={() => {
                    setFlowData(null);
                    setGoal('');
                  }}
                  className="bg-gray-800 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Generate New Flow
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showGoalForm && renderGoalForm()}
      </AnimatePresence>
    </div>
  );
};

export default StudyFlow;
