import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import useTrackTime from '../hooks/useTrackTime';
import { trackLogin } from '../services/userService';
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
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useTrackTime(firebaseUid);

  useEffect(() => {
    let intervalId;
    async function fetchStats() {
      if (firebaseUid) {
        const loginRes = await trackLogin(firebaseUid);
        if (loginRes) {
          setStreak(loginRes.streak);
          setMaxStreak(loginRes.maxStreak);
        }
        // Fetch today's time spent
        try {
          const today = new Date().toISOString().split('T')[0];
          const res = await fetch(`http://localhost:5000/api/user/${firebaseUid}/session?date=${today}`);
          const data = await res.json();
          setTotalTime(data.totalTime || 0);
        } catch (err) {
          console.error('Error fetching session data:', err);
          setTotalTime(0);
        }
      }
    }
    fetchStats();
    // Poll every minute for live update
    intervalId = setInterval(fetchStats, 60000);
    return () => clearInterval(intervalId);
  }, [firebaseUid]);

  // Tab navigation data
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ];

  // Achievement data
  const achievements = [
    { id: 1, name: 'First Steps', description: 'Complete your first study session', icon: Star, earned: true },
    { id: 2, name: 'Streak Master', description: 'Maintain a 7-day study streak', icon: Flame, earned: streak >= 7 },
    { id: 3, name: 'Time Lord', description: 'Study for 60 minutes in a day', icon: Clock, earned: Math.floor(totalTime / 60) >= 60 },
    { id: 4, name: 'Consistency', description: 'Study for 5 consecutive days', icon: Target, earned: streak >= 5 },
    { id: 5, name: 'Knowledge Seeker', description: 'Complete 10 study sessions', icon: BookOpen, earned: false },
    { id: 6, name: 'Brain Power', description: 'Achieve perfect score on a quiz', icon: Brain, earned: false }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8" />
                <span className="text-2xl font-bold">{Math.floor(totalTime / 60)}m</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Today's Study Time</h3>
              <p className="text-white/80 text-sm">Keep up the great work!</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <Flame className="w-8 h-8" />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
              <p className="text-white/80 text-sm">Days in a row</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8" />
                <span className="text-2xl font-bold">{achievements.filter(a => a.earned).length}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Achievements</h3>
              <p className="text-white/80 text-sm">Unlocked badges</p>
            </motion.div>
          </div>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
                Study Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Streak:</span>
                  <span className="font-semibold">{streak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Streak:</span>
                  <span className="font-semibold">{maxStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Today's Time:</span>
                  <span className="font-semibold">{Math.floor(totalTime / 60)} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Created:</span>
                  <span className="font-semibold">
                    {currentUser?.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <PieChart className="w-6 h-6 mr-2 text-green-400" />
                Progress Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Daily Goal Progress</span>
                    <span className="font-semibold">{Math.min(100, Math.floor((totalTime / 60) / 30 * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.floor((totalTime / 60) / 30 * 100))}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Achievements</span>
                    <span className="font-semibold">{Math.floor(achievements.filter(a => a.earned).length / achievements.length * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.floor(achievements.filter(a => a.earned).length / achievements.length * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'achievements':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  achievement.earned
                    ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}
              >
                <div className="flex items-center mb-4">
                  <achievement.icon className={`w-8 h-8 mr-3 ${achievement.earned ? 'text-yellow-400' : 'text-gray-500'}`} />
                  {achievement.earned && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
                </div>
                <h3 className="text-lg font-bold mb-2">{achievement.name}</h3>
                <p className="text-sm opacity-80">{achievement.description}</p>
                {achievement.earned && (
                  <div className="mt-3 text-xs text-yellow-400 font-medium">
                    ✨ UNLOCKED
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-purple-400" />
                Learning Progress
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-200">Study Habits</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="flex items-center">
                        <Flame className="w-5 h-5 mr-2 text-orange-400" />
                        Consistency
                      </span>
                      <span className="text-green-400 font-semibold">{streak > 0 ? 'Great!' : 'Keep going!'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-400" />
                        Daily Goal
                      </span>
                      <span className={`font-semibold ${Math.floor(totalTime / 60) >= 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {Math.floor(totalTime / 60)}/30 min
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-200">Next Goals</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Reach 10-day streak</span>
                        <span className="text-xs text-gray-400">{Math.floor(streak / 10 * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, streak / 10 * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Study 60 min/day</span>
                        <span className="text-xs text-gray-400">{Math.min(100, Math.floor(totalTime / 60 / 60 * 100))}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.floor(totalTime / 60 / 60 * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

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
                      <span>Joined {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{streak}</div>
                  <div className="text-white/80 text-sm">Day Streak</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{Math.floor(totalTime / 60)}</div>
                  <div className="text-white/80 text-sm">Minutes Today</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{maxStreak}</div>
                  <div className="text-white/80 text-sm">Best Streak</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;