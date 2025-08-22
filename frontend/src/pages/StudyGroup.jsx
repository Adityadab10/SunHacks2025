import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Users, UserPlus, Settings, Trash2, Crown } from 'lucide-react';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import MainSidebar from '../components/Sidebar';
import GroupSidebar from '../components/GroupSidebar';
import CreateGroupModal from '../components/CreateGroupModal';
import InviteModal from '../components/InviteModal';
import GroupChat from '../components/GroupChat';

const socket = io('http://localhost:5000');

const StudyGroup = () => {
  const { firebaseUid } = useUser();
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteGroup, setInviteGroup] = useState(null);

  useEffect(() => {
    const userEmail = window.localStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail || '');
    if (userEmail) {
      fetchUserGroups(userEmail);
    }

    // Make sockepublic and it t globally available for chat component
    window.socket = socket;

    // Socket event listeners
    socket.on('receiveMessage', ({ groupId, message }) => {
      if (selectedGroup && groupId === selectedGroup._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('memberJoined', ({ groupId, member }) => {
      if (selectedGroup && groupId === selectedGroup._id) {
        setMembers((prev) => [...prev, member]);
        toast.success(`${member.displayName} joined the group`);
      }
    });

    socket.on('memberLeft', ({ groupId, memberId }) => {
      if (selectedGroup && groupId === selectedGroup._id) {
        setMembers((prev) => prev.filter(m => m._id !== memberId));
      }
    });

    // Typing indicator events
    socket.on('userTyping', ({ groupId, userId, userName, isTyping }) => {
      // This will be handled by the GroupChat component
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('memberJoined');
      socket.off('memberLeft');
      socket.off('userTyping');
      delete window.socket;
    };
  }, [selectedGroup]);

  const fetchUserGroups = async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:5000/api/group/groups-by-member?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const createGroup = async (groupName, addedMembers) => {
    try {
      const res = await fetch('http://localhost:5000/api/group/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, ownerEmail: currentUserEmail })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Add members after group creation
        for (const member of addedMembers) {
          await fetch(`http://localhost:5000/api/group/group/${data.group._id}/member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: member.email })
          });
        }
        
        fetchUserGroups(currentUserEmail);
        toast.success('Group created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create group');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const getGroupDetails = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/group/group/${groupId}`);
      const data = await res.json();
      
      if (data.success) {
        setSelectedGroup(data.group);
        setMembers(data.group.members || []);
        setMessages(data.group.messages || []);
        socket.emit('joinGroup', groupId);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast.error('Failed to load group details');
    }
  };

  const joinGroupWithCode = async (inviteCode) => {
    try {
      const res = await fetch(`http://localhost:5000/api/group/join-with-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, email: currentUserEmail })
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchUserGroups(currentUserEmail);
        toast.success(`Successfully joined "${data.group.name}"!`);
      } else {
        throw new Error(data.message || 'Failed to join group');
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const sendMessage = (content) => {
    if (!selectedGroup) return;
    
    socket.emit('sendMessage', {
      groupId: selectedGroup._id,
      senderId: firebaseUid,
      content
    });
  };

  const removeMember = async (memberId) => {
    if (!selectedGroup) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/group/group/${selectedGroup._id}/member/${memberId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMembers(prev => prev.filter(m => m._id !== memberId));
        toast.success('Member removed successfully');
      } else {
        throw new Error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/group/group/${groupId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setGroups(prev => prev.filter(g => g._id !== groupId));
        if (selectedGroup?._id === groupId) {
          setSelectedGroup(null);
          setMembers([]);
          setMessages([]);
        }
        toast.success('Group deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete group');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const showInvite = (group) => {
    setInviteGroup(group);
    setShowInviteModal(true);
  };

  const showJoinModal = () => {
    setInviteGroup(null); // Clear any selected group for general join
    setShowInviteModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      
      <div className="flex-1 flex">
        {/* Groups Sidebar */}
        <GroupSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          onGroupSelect={getGroupDetails}
          onCreateGroup={() => setShowCreateModal(true)}
          onJoinGroup={showJoinModal}
          onShowInvite={showInvite}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="bg-gray-900 border-b border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{selectedGroup.name}</h1>
                    <p className="text-gray-400">
                      {members.length} member{members.length !== 1 ? 's' : ''} • 
                      Created {new Date(selectedGroup.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showInvite(selectedGroup)}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </motion.button>
                    <button
                      onClick={() => deleteGroup(selectedGroup._id)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Members List */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Members ({members.length})
                  </h2>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {member.photoURL && (
                            <img src={member.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <p className="text-white font-medium flex items-center gap-2">
                              {member.displayName}
                              {selectedGroup.owner === member._id && (
                                <Crown className="w-4 h-4 text-yellow-400" />
                              )}
                            </p>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                          </div>
                        </div>
                        {selectedGroup.owner === firebaseUid && member._id !== selectedGroup.owner && (
                          <button
                            onClick={() => removeMember(member._id)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group Chat */}
                <div className="lg:col-span-2">
                  <GroupChat
                    group={selectedGroup}
                    messages={messages}
                    onSendMessage={sendMessage}
                    currentUserId={firebaseUid}
                    members={members}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to Study Groups</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                  Create or join study groups to collaborate with classmates, share resources, and chat in real-time.
                </p>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Create Group
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={showJoinModal}
                    className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Join Group
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateGroup={createGroup}
            currentUserEmail={currentUserEmail}
          />
        )}
        
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            group={inviteGroup}
            onJoinWithCode={joinGroupWithCode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyGroup;
