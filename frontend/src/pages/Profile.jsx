import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';
import MainSidebar from '../components/Sidebar';
import {
  User, Calendar, Trophy, Target, Flame, BookOpen, Clock, 
  TrendingUp, Award, Star, Zap, Brain, ChevronRight,
  BarChart3, PieChart, Activity, Users, Globe, CheckCircle
} from 'lucide-react';

const Profile = () => {
  const { mongoUid, firebaseUid, jwtToken } = useUser();
  const currentUser = auth.currentUser;
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with real data from your backend
  const userData = {
    joinDate: new Date(currentUser?.metadata?.creationTime || '2024-01-01'),
    studyStreak: 45,
    totalStudyTime: 128,
    coursesCompleted: 12,
    totalCourses: 18,
    level: 7,
    xp: 3420,
    nextLevelXp: 4000,
    badges: [
      { id: 1, name: 'Early Bird', icon: '🌅', description: 'Study before 8 AM for 7 days straight', earned: true },
      { id: 2, name: 'Night Owl', icon: '🦉', description: 'Study after 10 PM for 5 days', earned: true },
      { id: 3, name: 'Streak Master', icon: '🔥', description: 'Maintain a 30-day study streak', earned: true },
      { id: 4, name: 'Speed Learner', icon: '⚡', description: 'Complete 5 courses in a month', earned: true },
      { id: 5, name: 'Perfect Score', icon: '💯', description: 'Score 100% on 10 quizzes', earned: false },
      { id: 6, name: 'Scholar', icon: '🎓', description: 'Complete 20 courses', earned: false },
    ],
    weeklyProgress: [
      { day: 'Mon', hours: 3.5, completed: 2 },
      { day: 'Tue', hours: 2.8, completed: 1 },
      { day: 'Wed', hours: 4.2, completed: 3 },
      { day: 'Thu', hours: 1.5, completed: 1 },
      { day: 'Fri', hours: 3.8, completed: 2 },
      { day: 'Sat', hours: 5.2, completed: 4 },
      { day: 'Sun', hours: 2.1, completed: 1 },
    ],
    monthlyStats: {
      studyHours: [12, 18, 25, 22, 28, 35, 42, 38, 45, 52, 48, 55],
      coursesCompleted: [1, 2, 1, 3, 2, 4, 3, 2, 4, 3, 5, 2]
    },
    subjects: [
      { name: 'Mathematics', progress: 85, color: '#3B82F6' },
      { name: 'Physics', progress: 72, color: '#EF4444' },
      { name: 'Chemistry', progress: 91, color: '#10B981' },
      { name: 'Biology', progress: 68, color: '#F59E0B' },
      { name: 'Computer Science', progress: 94, color: '#8B5CF6' },
    ]
  };

  const completionPercentage = Math.round((userData.coursesCompleted / userData.totalCourses) * 100);
  const xpProgress = Math.round((userData.xp / userData.nextLevelXp) * 100);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-8 mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/20">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}
                  </h1>
                  <p className="text-white/80 text-lg mb-1">{currentUser?.email}</p>
                  <div className="flex items-center space-x-4 text-white/70">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {userData.joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4" />
                      <span>Level {userData.level}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-white">{userData.studyStreak}</div>
                  <div className="text-white/80 text-sm">Day Streak</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{userData.xp}</div>
                  <div className="text-white/80 text-sm">Total XP</div>
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-6 relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm">Level {userData.level} Progress</span>
                <span className="text-white/80 text-sm">{userData.xp}/{userData.nextLevelXp} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div 
                  className="bg-white rounded-full h-3"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-900 rounded-lg p-1">
            {['overview', 'analytics', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Stats Cards */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Course Progress</h3>
                          <p className="text-gray-400 text-sm">{userData.coursesCompleted}/{userData.totalCourses} completed</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{completionPercentage}%</div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className="bg-green-500 rounded-full h-2"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                          <Flame className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Study Streak</h3>
                          <p className="text-gray-400 text-sm">Keep it going!</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-400">{userData.studyStreak}</div>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(7)].map((_, i) => (
                        <div 
                          key={i}
                          className={`flex-1 h-2 rounded ${i < 5 ? 'bg-red-500' : 'bg-gray-700'}`}
                        />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Study Time</h3>
                          <p className="text-gray-400 text-sm">Total hours</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">{userData.totalStudyTime}h</div>
                    </div>
                    <p className="text-gray-400 text-sm">Average: {(userData.totalStudyTime / 30).toFixed(1)}h per day</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-600 p-2 rounded-lg">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Achievements</h3>
                          <p className="text-gray-400 text-sm">Badges earned</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {userData.badges.filter(b => b.earned).length}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {userData.badges.filter(b => !b.earned).length} more to unlock
                    </p>
                  </motion.div>
                </div>

                {/* Weekly Progress Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                >
                  <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                    <span>This Week's Progress</span>
                  </h3>
                  <div className="flex items-end justify-between space-x-2 h-40">
                    {userData.weeklyProgress.map((day, index) => (
                      <div key={day.day} className="flex-1 flex flex-col items-center">
                        <motion.div 
                          className="bg-green-500 rounded-t w-full mb-2"
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.hours / 6) * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        />
                        <span className="text-gray-400 text-sm">{day.day}</span>
                        <span className="text-white text-xs">{day.hours}h</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Subject Progress */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                >
                  <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                    <Target className="w-6 h-6 text-blue-400" />
                    <span>Subject Progress</span>
                  </h3>
                  <div className="space-y-4">
                    {userData.subjects.map((subject, index) => (
                      <motion.div
                        key={subject.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{subject.name}</span>
                          <span className="text-gray-400">{subject.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div 
                            className="rounded-full h-2"
                            style={{ backgroundColor: subject.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.progress}%` }}
                            transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Badges */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                >
                  <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    <span>Recent Badges</span>
                  </h3>
                  <div className="space-y-3">
                    {userData.badges.filter(b => b.earned).slice(0, 3).map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="text-white font-medium">{badge.name}</p>
                          <p className="text-gray-400 text-sm">{badge.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Monthly Study Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800"
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span>Monthly Study Hours</span>
                </h3>
                <div className="flex items-end justify-between space-x-1 h-48">
                  {userData.monthlyStats.studyHours.map((hours, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 bg-green-500 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${(hours / 60) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-gray-400 text-xs">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </motion.div>

              {/* Course Completion Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800"
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <PieChart className="w-6 h-6 text-purple-400" />
                  <span>Monthly Completions</span>
                </h3>
                <div className="flex items-end justify-between space-x-1 h-48">
                  {userData.monthlyStats.coursesCompleted.map((courses, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 bg-purple-500 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${(courses / 5) * 100}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-gray-400 text-xs">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-lg border transition-all duration-300 ${
                    badge.earned 
                      ? 'bg-gray-900 border-green-500 shadow-lg shadow-green-500/20' 
                      : 'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  {badge.earned && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-4xl mb-4">{badge.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">{badge.name}</h3>
                    <p className="text-gray-400 text-sm">{badge.description}</p>
                    {badge.earned && (
                      <span className="inline-block mt-3 px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                        Earned
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
