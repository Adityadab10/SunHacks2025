import { useUser } from '../context/UserContext';
import { BookOpen, TrendingUp, Clock, Award } from 'lucide-react';
import { auth } from '../../firebase.config';
import MainSidebar from '../components/Sidebar';

const Dashboard = () => {
  const { mongoUid, firebaseUid, jwtToken } = useUser();
  
  // Get current Firebase user for display data
  const currentUser = auth.currentUser;

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <MainSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-gray-400">
              Ready to continue your learning journey?
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-4">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
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
                <p className="text-sm text-gray-500">
                  Provider: {currentUser?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Firebase UID: {firebaseUid}</p>
                  <p>MongoDB UID: {mongoUid || 'Not synced'}</p>
                  <p>JWT Token: {jwtToken ? 'Active' : 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Courses Enrolled</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Study Hours</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Progress</p>
                  <p className="text-2xl font-bold">67%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Achievements</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Completed Introduction to AI</p>
                  <p className="text-gray-400 text-sm">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Started Machine Learning Basics</p>
                  <p className="text-gray-400 text-sm">Yesterday</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Earned "Quick Learner" badge</p>
                  <p className="text-gray-400 text-sm">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
