import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, Users, UserCheck, RefreshCw, Mail, Eye, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, currentUserEmail }) => {
  const [groupName, setGroupName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addedMembers, setAddedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'search'

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen]);

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/all');
      const data = await res.json();
      if (data.success) {
        // Filter out current user
        const filteredUsers = (data.users || []).filter(user => user.email !== currentUserEmail);
        setAllUsers(filteredUsers);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:5000/api/search-user?email=${encodeURIComponent(searchEmail.trim())}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const addUserToGroup = (user) => {
    if (user.email === currentUserEmail) {
      toast.error('You will be added automatically as the group owner');
      return;
    }
    if (!addedMembers.some(m => m._id === user._id)) {
      setAddedMembers([...addedMembers, user]);
      toast.success(`${user.displayName} added to group`);
    } else {
      toast.error('User already added');
    }
  };

  const removeUserFromGroup = (userId) => {
    setAddedMembers(addedMembers.filter(m => m._id !== userId));
  };

  const isUserAdded = (userId) => {
    return addedMembers.some(m => m._id === userId);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    setIsCreating(true);
    try {
      await onCreateGroup(groupName.trim(), addedMembers);
      setGroupName('');
      setAddedMembers([]);
      setSearchResults([]);
      setSearchEmail('');
      onClose();
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setAddedMembers([]);
    setSearchResults([]);
    setSearchEmail('');
    setActiveTab('browse');
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
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl w-[800px] max-w-[95vw] max-h-[90vh] overflow-hidden backdrop-blur-lg"
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-[#74AA9C]/10 to-transparent p-8 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Study Group</h2>
                <p className="text-gray-400 text-sm mt-1">Set up a new collaborative learning space</p>
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

        <div className="p-8 max-h-[calc(90vh-140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#74AA9C]/30 scrollbar-track-transparent">
          {/* Enhanced Group Name Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <label className="block text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#74AA9C]" />
              Group Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter an engaging group name..."
                className="w-full p-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#74AA9C]/30 focus:border-[#74AA9C]/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                autoFocus
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#74AA9C]/5 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>

          {/* Enhanced Add Members Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <label className="block text-white font-semibold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#74AA9C]" />
              Add Members
            </label>
            
            {/* Enhanced Tab Navigation */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'browse', icon: Eye, label: 'Browse Users' },
                { id: 'search', icon: Mail, label: 'Search by Email' }
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] text-white shadow-lg'
                      : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60 border border-gray-600/30'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Enhanced Browse Users Tab */}
            {activeTab === 'browse' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-6 border border-gray-600/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#74AA9C]" />
                    Available Users
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchAllUsers}
                    disabled={isLoadingUsers}
                    className="flex items-center gap-2 text-[#74AA9C] hover:text-[#5a8a7d] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    {isLoadingUsers ? 'Refreshing...' : 'Refresh'}
                  </motion.button>
                </div>
                
                {isLoadingUsers ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-[#74AA9C]/30 border-t-[#74AA9C] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium">Loading users...</p>
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#74AA9C]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#74AA9C]" />
                    </div>
                    <p className="text-gray-400 font-medium">No other users found</p>
                    <p className="text-gray-500 text-sm mt-1">Try refreshing or check back later</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[#74AA9C]/30 scrollbar-track-transparent">
                    {allUsers.map((user, index) => (
                      <motion.div 
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/60 to-gray-800/40 rounded-xl border border-gray-600/30 hover:border-[#74AA9C]/40 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-[#74AA9C]/30 shadow-lg" />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold">
                                  {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold truncate">{user.displayName}</p>
                            <p className="text-gray-400 text-sm truncate">{user.email}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => isUserAdded(user._id) ? removeUserFromGroup(user._id) : addUserToGroup(user)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                            isUserAdded(user._id)
                              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                              : 'bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] text-white'
                          }`}
                        >
                          {isUserAdded(user._id) ? (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Enhanced Search by Email Tab */}
            {activeTab === 'search' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter email address to search..."
                      className="w-full p-4 pl-12 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#74AA9C]/30 focus:border-[#74AA9C]/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                    />
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={searchUser}
                    disabled={isSearching || !searchEmail.trim()}
                    className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] disabled:from-gray-700 disabled:to-gray-800 px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
                  >
                    <Search className={`w-5 h-5 ${isSearching ? 'animate-pulse' : ''}`} />
                    {isSearching ? 'Searching...' : 'Search'}
                  </motion.button>
                </div>

                {/* Enhanced Search Results */}
                {searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-6 border border-gray-600/30 backdrop-blur-sm"
                  >
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#74AA9C]" />
                      Search Results
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#74AA9C]/30 scrollbar-track-transparent">
                      {searchResults.map((user, index) => (
                        <motion.div 
                          key={user._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/60 to-gray-800/40 rounded-xl border border-gray-600/30"
                        >
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#74AA9C]/30" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold">{user.displayName}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addUserToGroup(user)}
                            className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Enhanced Added Members Display */}
            {addedMembers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#74AA9C]/10 to-transparent rounded-2xl p-6 mt-6 border border-[#74AA9C]/20 backdrop-blur-sm"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#74AA9C]" />
                  Selected Members ({addedMembers.length})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#74AA9C]/30 scrollbar-track-transparent">
                  {addedMembers.map((member, index) => (
                    <motion.div 
                      key={member._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/40 rounded-xl border border-gray-600/30"
                    >
                      <div className="flex items-center gap-3">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#74AA9C]/30" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {member.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold">{member.displayName}</p>
                          <p className="text-gray-400 text-sm">{member.email}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeUserFromGroup(member._id)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end gap-4 pt-6 border-t border-gray-700/50"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="px-8 py-3 text-gray-400 hover:text-white transition-colors font-semibold rounded-xl hover:bg-gray-800/60"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 10px 30px rgba(116, 170, 156, 0.4)" 
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateGroup}
              disabled={isCreating || !groupName.trim()}
              className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] disabled:from-gray-700 disabled:to-gray-800 px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Group...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Group ({addedMembers.length + 1} members)
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateGroupModal;