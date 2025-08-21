
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';
import MainSidebar from '../components/Sidebar';

const Dashboard = () => {
  const { firebaseUid } = useUser();
  const currentUser = auth.currentUser;
  const [minutesSpent, setMinutesSpent] = useState(0);
  const [streak, setStreak] = useState(1);

  // Fetch session time from backend (same as Profile)
  useEffect(() => {
    let intervalId;
    async function fetchSessionTime() {
      if (firebaseUid) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const res = await fetch(`http://localhost:5000/api/user/${firebaseUid}/session?date=${today}`);
          const data = await res.json();
          setMinutesSpent(Math.floor((data.totalTime || 0) / 60));
        } catch (err) {
          setMinutesSpent(0);
        }
      }
    }
    fetchSessionTime();
    intervalId = setInterval(fetchSessionTime, 60000);
    return () => clearInterval(intervalId);
  }, [firebaseUid]);

  // Streak logic (simple: checks localStorage for login days)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakDays = JSON.parse(localStorage.getItem('loginDays') || '[]');
    const todayStr = today.toISOString().slice(0, 10);
    if (!streakDays.includes(todayStr)) {
      streakDays.push(todayStr);
      localStorage.setItem('loginDays', JSON.stringify(streakDays));
    }
    // Count consecutive days
    streakDays = streakDays.sort();
    let count = 1;
    for (let i = streakDays.length - 2; i >= 0; i--) {
      const prev = new Date(streakDays[i]);
      const curr = new Date(streakDays[i + 1]);
      if ((curr - prev) === 86400000) {
        count++;
      } else {
        break;
      }
    }
    setStreak(count);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-gray-400">Ready to continue your learning journey?</p>
          </div>

          {/* Profile Section - Only basic dynamic data */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-4">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-gray-400">{currentUser?.email}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Day Streak: <b>{streak}</b></p>
                  <p>Time spent on this website: <b>{minutesSpent}</b> min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section - Only show dynamic time spent */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Stats</h2>
            <div className="flex items-center space-x-8">
              <div>
                <p className="text-gray-400 text-sm">Day Streak</p>
                <p className="text-2xl font-bold">{streak}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Time Spent</p>
                <p className="text-2xl font-bold">{minutesSpent} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
