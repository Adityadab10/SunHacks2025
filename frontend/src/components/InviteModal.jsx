import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Share2, QrCode, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const InviteModal = ({ isOpen, onClose, group, onJoinWithCode }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const copyInviteLink = () => {
    if (group?.inviteCode) {
      const inviteLink = `${window.location.origin}/join-group?code=${group.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }
    setIsJoining(true);
    try {
      await onJoinWithCode(joinCode.trim());
      setJoinCode('');
      onClose();
    } catch (error) {
      toast.error('Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-[500px] max-w-[90vw]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-400" />
            {group ? 'Invite & Join' : 'Join Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Share Group Section - Only show if group is provided */}
        {group && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Share "{group.name}"</h3>
            
            {/* Invite Code Display */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Invite Code</p>
                  <p className="text-white font-mono text-lg">{group.inviteCode || 'Loading...'}</p>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={copyInviteLink}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-white transition-colors flex items-center gap-3"
              >
                <Share2 className="w-5 h-5 text-purple-400" />
                <div className="text-left">
                  <p className="font-semibold">Copy Invite Link</p>
                  <p className="text-gray-400 text-sm">Share a direct link to join the group</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Join Group Section */}
        <div className={group ? "border-t border-gray-700 pt-6" : ""}>
          <h3 className="text-lg font-semibold text-white mb-4">
            {group ? 'Join Another Group' : 'Enter Invite Code'}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code..."
              className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
              autoFocus={!group}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleJoinGroup}
              disabled={isJoining || !joinCode.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-6 py-3 rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {isJoining ? 'Joining...' : 'Join'}
            </motion.button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {group 
              ? 'Enter an invite code to join a different study group'
              : 'Ask a group member for their invite code to join their study group'
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteModal;
