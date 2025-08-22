import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, Users, UserCheck } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-[700px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Create Study Group
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Group Name */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Add Members Section */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-4">Add Members</label>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'browse'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Browse Users
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'search'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Search by Email
            </button>
          </div>

          {/* Browse Users Tab */}
          {activeTab === 'browse' && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Available Users</h3>
                <button
                  onClick={fetchAllUsers}
                  disabled={isLoadingUsers}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  {isLoadingUsers ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {isLoadingUsers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading users...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No other users found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        {user.photoURL && (
                          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <p className="text-white font-medium">{user.displayName}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => isUserAdded(user._id) ? removeUserFromGroup(user._id) : addUserToGroup(user)}
                        className={`px-3 py-1 rounded text-white transition-colors flex items-center gap-1 ${
                          isUserAdded(user._id)
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isUserAdded(user._id) ? (
                          <>
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search by Email Tab */}
          {activeTab === 'search' && (
            <div>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search by email..."
                  className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-purple-500/30 focus:border-purple-500/30 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={searchUser}
                  disabled={isSearching || !searchEmail.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-4 py-3 rounded-lg text-white transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? 'Searching...' : 'Search'}
                </motion.button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Search Results</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {searchResults.map(user => (
                      <div key={user._id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div className="flex items-center gap-2">
                          {user.photoURL && (
                            <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <p className="text-white font-medium">{user.displayName}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addUserToGroup(user)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Added Members */}
          {addedMembers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mt-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-400" />
                Selected Members ({addedMembers.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {addedMembers.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                      {member.photoURL && (
                        <img src={member.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="text-white font-medium">{member.displayName}</p>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeUserFromGroup(member._id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-6 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Group ({addedMembers.length + 1} members)
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateGroupModal;
