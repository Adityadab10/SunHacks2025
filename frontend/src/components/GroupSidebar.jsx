import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, MessageCircle, Settings, UserPlus, Copy, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    margin: 1px;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(116, 170, 156, 0.2);
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(116, 170, 156, 0.4);
  }
  
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(116, 170, 156, 0.3);
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(116, 170, 156, 0.2) transparent;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}
import toast from 'react-hot-toast';

const GroupSidebar = ({ 
  groups, 
  selectedGroup, 
  onGroupSelect, 
  onCreateGroup,
  onJoinGroup,
  onShowInvite 
}) => {
  const [copiedGroup, setCopiedGroup] = useState(null);

  const copyInviteCode = (group, e) => {
    e.stopPropagation();
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopiedGroup(group._id);
      setTimeout(() => setCopiedGroup(null), 2000);
      toast.success('Invite code copied to clipboard!');
    }
  };

  return (
    <div className="w-80 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800/50 flex flex-col h-full backdrop-blur-sm">
      {/* Enhanced Header */}
      <div className="relative p-6 border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-[#74AA9C]/5 to-transparent"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Study Groups</h2>
                <p className="text-gray-400 text-xs">Collaborative learning spaces</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCreateGroup}
                className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] p-2.5 rounded-xl transition-all duration-300 shadow-lg group"
                title="Create New Group"
              >
                <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onJoinGroup}
                className="bg-gray-800/80 hover:bg-[#74AA9C]/20 p-2.5 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-[#74AA9C]/40 shadow-lg"
                title="Join Existing Group"
              >
                <UserPlus className="w-4 h-4 text-gray-300 hover:text-[#74AA9C] transition-colors" />
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <div className="w-2 h-2 bg-[#74AA9C] rounded-full animate-pulse"></div>
              <span className="font-medium">
                {groups.length} group{groups.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Groups List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {groups.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#74AA9C]/20 to-[#5a8a7d]/20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm border border-[#74AA9C]/20 shadow-2xl">
                <Users className="w-10 h-10 text-[#74AA9C]" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-[#74AA9C]/5 rounded-full blur-2xl -z-10"></div>
            </div>
            
            <h3 className="text-white font-bold text-lg mb-2">No Groups Yet</h3>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              Create your first study group or join an existing one to start collaborating with others.
            </p>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateGroup}
                className="w-full bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Create Your First Group
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onJoinGroup}
                className="w-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 border border-gray-600/50 hover:border-[#74AA9C]/30 flex items-center justify-center gap-3 shadow-lg group"
              >
                <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Join Existing Group
              </motion.button>
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-[#74AA9C]/10 to-transparent rounded-xl border border-[#74AA9C]/20">
              <p className="text-gray-400 text-xs leading-relaxed">
                💡 <strong className="text-white">Tip:</strong> Study groups help you collaborate, share resources, and chat in real-time with classmates.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {groups.map((group, index) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 20, x: -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm shadow-lg ${
                    selectedGroup?._id === group._id
                      ? 'bg-gradient-to-r from-[#74AA9C]/20 to-[#5a8a7d]/20 border-[#74AA9C]/40 shadow-[#74AA9C]/20'
                      : 'bg-gradient-to-r from-gray-800/60 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/40 border-gray-600/30 hover:border-[#74AA9C]/30'
                  }`}
                  onClick={() => onGroupSelect(group._id)}
                >
                  {/* Selection Indicator */}
                  {selectedGroup?._id === group._id && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#74AA9C] to-[#5a8a7d] rounded-r-full"></div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                        selectedGroup?._id === group._id
                          ? 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d]'
                          : 'bg-gray-700/60 group-hover:bg-[#74AA9C]/20'
                      }`}>
                        <Users className={`w-5 h-5 ${
                          selectedGroup?._id === group._id ? 'text-white' : 'text-gray-300 group-hover:text-[#74AA9C]'
                        } transition-colors`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white truncate text-lg">{group.name}</h3>
                        <p className="text-gray-400 text-xs truncate">Study collaboration space</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowInvite(group);
                        }}
                        className="p-2 hover:bg-[#74AA9C]/20 rounded-lg transition-colors"
                        title="Invite Members"
                      >
                        <UserPlus className="w-4 h-4 text-gray-400 hover:text-[#74AA9C]" />
                      </motion.button>
                      
                      {group.inviteCode && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => copyInviteCode(group, e)}
                          className="p-2 hover:bg-[#74AA9C]/20 rounded-lg transition-colors"
                          title="Copy Invite Code"
                        >
                          {copiedGroup === group._id ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-[#74AA9C]" />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`flex items-center gap-2 font-medium ${
                        selectedGroup?._id === group._id ? 'text-[#74AA9C]' : 'text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          selectedGroup?._id === group._id ? 'bg-[#74AA9C]' : 'bg-gray-500'
                        }`}></div>
                        {group.members?.length || 0} members
                      </span>
                    </div>
                    
                    <div className={`flex items-center gap-2 text-xs font-medium ${
                      selectedGroup?._id === group._id ? 'text-[#74AA9C]' : 'text-gray-500'
                    }`}>
                      <MessageCircle className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#74AA9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Enhanced Footer */}
      {groups.length > 0 && (
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateGroup}
              className="flex-1 bg-gradient-to-r from-[#74AA9C]/20 to-[#5a8a7d]/20 hover:from-[#74AA9C]/30 hover:to-[#5a8a7d]/30 px-4 py-3 rounded-xl text-[#74AA9C] font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-[#74AA9C]/30 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4" />
              Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoinGroup}
              className="flex-1 bg-gray-800/60 hover:bg-gray-700/60 px-4 py-3 rounded-xl text-gray-300 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-gray-600/50 hover:border-[#74AA9C]/30 backdrop-blur-sm"
            >
              <UserPlus className="w-4 h-4" />
              Join
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSidebar;