import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../components/Sidebar';
import YTTranscribe from '../components/YTTranscribe';
import YTStudyBoard from '../components/YTStudyBoard';
import { useUser } from '../context/UserContext';
import {
  Loader2, AlertCircle, BrainCircuit, FileText
} from 'lucide-react';

const YouTubePage = () => {
  const { mongoUid, firebaseUid, loading: userLoading } = useUser();
  const [activeComponent, setActiveComponent] = useState('transcribe');

  const components = [
    {
      id: 'transcribe',
      label: 'Quick Summarize',
      icon: FileText,
      description: 'Get quick AI summaries in 3 formats',
      component: YTTranscribe
    },
    {
      id: 'studyboard',
      label: 'Study Board',
      icon: BrainCircuit,
      description: 'Create comprehensive study materials',
      component: YTStudyBoard
    }
  ];

  // Show loading spinner while user data is being fetched
  if (userLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-400" />
            <p className="text-gray-400">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not properly authenticated
  if (!firebaseUid || !mongoUid) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">
              Please log in and ensure your profile is synced to use the YouTube tools.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ActiveComponent = components.find(comp => comp.id === activeComponent)?.component || YTTranscribe;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header with Component Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                YouTube
              </span> AI Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Transform YouTube videos into powerful learning materials with our AI-powered tools.
            </p>

            {/* Component Selector */}
            <div className="flex justify-center space-x-4 mb-8">
              {components.map((comp) => {
                const Icon = comp.icon;
                return (
                  <motion.button
                    key={comp.id}
                    onClick={() => setActiveComponent(comp.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                      activeComponent === comp.id
                        ? 'bg-gradient-to-r from-red-500 to-purple-500 border-transparent text-white shadow-lg'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`p-3 rounded-xl ${
                        activeComponent === comp.id 
                          ? 'bg-white/20' 
                          : 'bg-gray-800'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold mb-1">{comp.label}</h3>
                        <p className={`text-sm ${
                          activeComponent === comp.id 
                            ? 'text-white/80' 
                            : 'text-gray-500'
                        }`}>
                          {comp.description}
                        </p>
                      </div>
                    </div>
                    
                    {activeComponent === comp.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-500 rounded-2xl"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Active Component */}
          <motion.div
            key={activeComponent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePage;
