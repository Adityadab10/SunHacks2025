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
            {/* Quick Stats - unified glass/accent theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#74AA9C]/10 rounded-xl">
                  <Clock className="w-8 h-8 text-[#74AA9C]" />
                </div>
                <span className="text-3xl font-bold font-mono">{Math.floor(totalTime / 60)}<span className="text-lg font-normal"> mins today</span></span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#74AA9C]">Today's Study Time</h3>
              <p className="text-white/80 text-sm">Keep up the great work!</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#74AA9C]/10 rounded-xl">
                  <Flame className="w-8 h-8 text-[#74AA9C]" />
                </div>
                <span className="text-3xl font-bold font-mono">{streak}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#74AA9C]">Current Streak</h3>
              <p className="text-white/80 text-sm">Days in a row</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#74AA9C]/10 rounded-xl">
                  <Trophy className="w-8 h-8 text-[#74AA9C]" />
                </div>
                <span className="text-3xl font-bold font-mono">{achievements.filter(a => a.earned).length}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#74AA9C]">Achievements</h3>
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
          {/* Header Section - Glassmorphism, accent gradients, floating avatar */}
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
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="relative">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-2xl border-4 border-[#74AA9C]/40 shadow-2xl object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-[#74AA9C]/30 to-black/30 rounded-2xl flex items-center justify-center border-4 border-[#74AA9C]/40 shadow-2xl">
                      <User className="w-14 h-14 text-[#74AA9C]" />
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#74AA9C] rounded-full flex items-center justify-center shadow-lg border-2 border-black">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent drop-shadow-lg">
                    {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}
                  </h1>
                  <p className="text-[#74AA9C]/80 text-lg mb-2 font-mono">{currentUser?.email}</p>
                  <div className="flex items-center space-x-6 text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-[#74AA9C]" />
                      <span>Joined {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-[#74AA9C]" />
                      <span className="font-bold text-[#74AA9C]">Level 7 Scholar</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-4 text-center">
                <div className="p-5 bg-gradient-to-br from-[#74AA9C]/40 to-black/30 rounded-2xl border border-[#74AA9C]/50 shadow-lg min-w-[90px]">
                  <div className="text-3xl font-bold text-[#74AA9C] mb-1 font-mono">{streak}</div>
                  <div className="text-[#74AA9C]/80 text-xs font-semibold">STREAK</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-[#74AA9C]/40 to-black/30 rounded-2xl border border-[#74AA9C]/50 shadow-lg min-w-[90px]">
                  <div className="text-3xl font-bold text-[#74AA9C] mb-1 font-mono">{Math.floor(totalTime / 60)}<span className="text-lg font-normal"> mins today</span></div>
                  <div className="text-[#74AA9C]/80 text-xs font-semibold">TODAY</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-[#74AA9C]/40 to-black/30 rounded-2xl border border-[#74AA9C]/50 shadow-lg min-w-[90px]">
                  <div className="text-3xl font-bold text-[#74AA9C] mb-1 font-mono">{maxStreak}</div>
                  <div className="text-[#74AA9C]/80 text-xs font-semibold">BEST</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation - glass, accent, animated underline */}
          <div className="mb-10">
            <div className="flex space-x-2 bg-gradient-to-r from-black via-[#222] to-black p-2 rounded-2xl border border-[#74AA9C]/20 shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-7 py-3 rounded-xl font-semibold transition-all duration-200 overflow-hidden ${
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

export default Profile;