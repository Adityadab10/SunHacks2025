import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Share2, QrCode, Users, UserPlus, Link, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const InviteModal = ({ isOpen, onClose, group, onJoinWithCode }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const copyInviteLink = () => {
    if (group?.inviteCode) {
      const inviteLink = `${window.location.origin}/join-group?code=${group.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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

  const handleClose = () => {
    setJoinCode('');
    setCopiedCode(false);
    setCopiedLink(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl w-[600px] max-w-[95vw] overflow-hidden backdrop-blur-lg"
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-[#74AA9C]/10 to-transparent p-8 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-xl flex items-center justify-center shadow-lg">
                {group ? <Share2 className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {group ? 'Share & Invite' : 'Join Study Group'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {group ? 'Invite others to join your group' : 'Enter an invite code to join a group'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="w-10 h-10 bg-gray-800/80 hover:bg-red-600/20 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-300 border border-gray-700/50"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="p-8">
          {/* Share Group Section - Only show if group is provided */}
          {group && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-[#74AA9C]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Share "{group.name}"</h3>
                  <p className="text-gray-400 text-sm">Invite others to collaborate</p>
                </div>
              </div>
              
              {/* Enhanced Invite Code Display */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-6 border border-gray-600/30 backdrop-blur-sm mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#74AA9C]" />
                      Invite Code
                    </p>
                    <div className="bg-black/30 rounded-xl p-4 border border-gray-600/50">
                      <p className="text-white font-mono text-2xl tracking-wider text-center">
                        {group.inviteCode || 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyInviteCode}
                    className={`ml-6 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                      copiedCode 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] text-white'
                    }`}
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Code
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Enhanced Share Options */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyInviteLink}
                  className={`w-full p-5 rounded-2xl transition-all duration-300 flex items-center gap-4 border ${
                    copiedLink
                      ? 'bg-gradient-to-r from-green-600/20 to-green-700/20 border-green-500/40'
                      : 'bg-gradient-to-r from-gray-800/60 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/40 border-gray-600/30 hover:border-[#74AA9C]/40'
                  } backdrop-blur-sm group`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    copiedLink 
                      ? 'bg-green-600' 
                      : 'bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] group-hover:from-[#5a8a7d] group-hover:to-[#74AA9C]'
                  }`}>
                    {copiedLink ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Link className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white text-lg">
                      {copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {copiedLink ? 'Share the link with others' : 'Share a direct link to join the group'}
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#74AA9C] transition-colors" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Enhanced Join Group Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: group ? 0.2 : 0 }}
            className={group ? "border-t border-gray-700/50 pt-8" : ""}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#74AA9C]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {group ? 'Join Another Group' : 'Enter Invite Code'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {group 
                    ? 'Have an invite code for a different group?' 
                    : 'Get the invite code from a group member'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER-INVITE-CODE"
                  className="w-full p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#74AA9C]/30 focus:border-[#74AA9C]/50 focus:outline-none transition-all duration-300 backdrop-blur-sm font-mono text-lg tracking-wider text-center"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
                  autoFocus={!group}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#74AA9C]/5 to-transparent pointer-events-none"></div>
              </div>

              <motion.button
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 30px rgba(116, 170, 156, 0.4)" 
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinGroup}
                disabled={isJoining || !joinCode.trim()}
                className="w-full bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] disabled:from-gray-700 disabled:to-gray-800 px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Joining Group...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Join Study Group
                  </>
                )}
              </motion.button>
            </div>

            {/* Help Text */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-gradient-to-r from-[#74AA9C]/10 to-transparent rounded-xl border border-[#74AA9C]/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-[#74AA9C]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">How to join a group:</p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Ask a group member for their unique invite code, then enter it above to instantly join their study group and start collaborating.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InviteModal;