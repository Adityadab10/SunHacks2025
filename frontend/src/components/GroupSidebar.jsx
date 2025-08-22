import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, MessageCircle, Settings, UserPlus, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupSidebar = ({ 
  groups, 
  selectedGroup, 
  onGroupSelect, 
  onCreateGroup,
  onJoinGroup,
  onShowInvite 
}) => {
  const copyInviteCode = (group) => {
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Study Groups
          </h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateGroup}
              className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition-colors"
              title="Create Group"
            >
              <Plus className="w-4 h-4 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoinGroup}
              className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors"
              title="Join Group"
            >
              <UserPlus className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          {groups.length} group{groups.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No groups yet</p>
            <div className="space-y-2">
              <button
                onClick={onCreateGroup}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Create Your First Group
              </button>
              <button
                onClick={onJoinGroup}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Join a Group
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <motion.div
                key={group._id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedGroup?._id === group._id
                    ? 'bg-purple-600 border border-purple-500'
                    : 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                }`}
                onClick={() => onGroupSelect(group._id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white truncate">{group.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowInvite(group);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </button>
                    {group.inviteCode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInviteCode(group);
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.members?.length || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Chat
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSidebar;
