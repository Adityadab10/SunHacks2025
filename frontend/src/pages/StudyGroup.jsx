import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Users, UserPlus, Settings, Trash2, Crown, MessageCircle, Calendar, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showMembersPanel, setShowMembersPanel] = useState(true);
  const [isMembersPanelCollapsed, setIsMembersPanelCollapsed] = useState(false);

  useEffect(() => {
    const userEmail = window.localStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail || '');
    if (userEmail) {
      fetchUserGroups(userEmail);
    }

    // Make socket globally available for chat component
    window.socket = socket;

    // Socket event listeners
    socket.on('receiveMessage', ({ groupId, message }) => {
      console.log('📨 RECEIVED MESSAGE:', {
        groupId,
        selectedGroupId: selectedGroup?._id,
        messageType: message.messageType,
        isPinned: message.isPinned,
        isSystemMessage: message.isSystemMessage
      });

      if (selectedGroup && groupId === selectedGroup._id) {
        setMessages((prev) => [...prev, message]);
        
        // Show toast for study board shares
        if (message.isSystemMessage && message.messageType === 'studyboard_share') {
          try {
            const content = JSON.parse(message.content);
            console.log('📚 STUDY BOARD SHARE RECEIVED:', {
              type: content.type,
              studyBoardName: content.studyBoardName,
              sharedBy: content.sharedBy,
              isPinned: message.isPinned
            });

            if (content.type === 'studyboard_share') {
              if (message.isPinned) {
                toast.success(`📌 ${content.sharedBy} pinned a study board: ${content.studyBoardName}`, {
                  duration: 5000,
                  icon: '📌'
                });
              } else {
                toast.success(`📚 ${content.sharedBy} shared a study board: ${content.studyBoardName}`, {
                  duration: 4000,
                  icon: '📚'
                });
              }
            }
          } catch (e) {
            console.error('❌ Error parsing study board share content:', e);
          }
        }
      }
    });

    // Listen for pinned message events
    socket.on('pinnedMessageAdded', ({ groupId, pinnedMessage }) => {
      console.log('📌 PINNED MESSAGE ADDED EVENT:', {
        groupId,
        selectedGroupId: selectedGroup?._id,
        pinnedMessage: pinnedMessage ? {
          messageType: pinnedMessage.messageType,
          isPinned: pinnedMessage.isPinned,
          content: pinnedMessage.content ? JSON.parse(pinnedMessage.content)?.studyBoardName : 'No content'
        } : null
      });

      if (selectedGroup && groupId === selectedGroup._id) {
        console.log('✅ Pinned message event processed for current group');
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
      socket.off('pinnedMessageAdded');
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
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <MainSidebar />
      
      <div className="flex-1 flex min-h-screen">
        {/* Groups Sidebar */}
        <GroupSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          onGroupSelect={getGroupDetails}
          onCreateGroup={() => setShowCreateModal(true)}
          onJoinGroup={showJoinModal}
          onShowInvite={showInvite}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-[#74AA9C]/20 p-6 shadow-2xl shrink-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                        {selectedGroup.name}
                      </h1>
                      <div className="flex items-center space-x-4 text-gray-300">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-[#74AA9C]" />
                          <span className="font-medium">
                            {members.length} member{members.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-[#74AA9C]" />
                          <span>Created {new Date(selectedGroup.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(116, 170, 156, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMembersPanelCollapsed(!isMembersPanelCollapsed)}
                      className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-4 py-3 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
                    >
                      {isMembersPanelCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      {isMembersPanelCollapsed ? 'Show' : 'Hide'} Members
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(116, 170, 156, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showInvite(selectedGroup)}
                      className="bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      Invite Members
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: "#dc2626" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteGroup(selectedGroup._id)}
                      className="bg-red-600/80 hover:bg-red-600 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Group
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Main Content with Flexible Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Group Chat - Main Area */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${isMembersPanelCollapsed ? 'flex-1' : 'flex-1 max-w-[calc(100%-400px)]'} flex flex-col bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-lg m-6 mr-3 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-500`}
                >
                  <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-[#74AA9C]/10 to-transparent shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-[#74AA9C]" />
                      </div>
                      Group Chat
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Share ideas and collaborate in real-time</p>
                  </div>
                  
                  {/* Chat Container with proper height */}
                  <div className="flex-1 min-h-0">
                    <GroupChat
                      group={selectedGroup}
                      messages={messages}
                      onSendMessage={sendMessage}
                      currentUserId={firebaseUid}
                      members={members}
                    />
                  </div>
                </motion.div>

                {/* Members Panel - Collapsible */}
                <AnimatePresence>
                  {!isMembersPanelCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: 300, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 400 }}
                      exit={{ opacity: 0, x: 300, width: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-lg m-6 ml-3 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
                    >
                      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-[#74AA9C]/10 to-transparent shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#74AA9C]" />
                            </div>
                            Members ({members.length})
                          </h2>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMembersPanelCollapsed(true)}
                            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </motion.button>
                        </div>
                        <p className="text-gray-400 text-sm">Group participants and their roles</p>
                      </div>
                      
                      {/* Members List with proper scrolling */}
                      <div className="flex-1 p-6 overflow-y-auto min-h-0">
                        <div className="space-y-4">
                          {members.map((member, index) => (
                            <motion.div 
                              key={member._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group relative"
                            >
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/40 rounded-xl border border-gray-600/30 hover:border-[#74AA9C]/40 transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="relative shrink-0">
                                    {member.photoURL ? (
                                      <img 
                                        src={member.photoURL} 
                                        alt="Profile" 
                                        className="w-12 h-12 rounded-full border-2 border-[#74AA9C]/30 shadow-lg" 
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7d] rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white font-semibold text-sm">
                                          {member.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                    )}
                                    {selectedGroup.owner === member._id && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                        <Crown className="w-3 h-3 text-yellow-900" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white font-semibold truncate text-base">
                                      {member.displayName}
                                    </p>
                                    <p className="text-gray-400 text-sm truncate">{member.email}</p>
                                    {selectedGroup.owner === member._id && (
                                      <p className="text-yellow-400 text-xs font-medium">Group Owner</p>
                                    )}
                                  </div>
                                </div>
                                {selectedGroup.owner === firebaseUid && member._id !== selectedGroup.owner && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeMember(member._id)}
                                    className="opacity-0 group-hover:opacity-100 bg-red-600/80 hover:bg-red-600 p-2 rounded-lg text-white transition-all duration-300 shadow-lg shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Welcome Screen - unchanged */
            <div className="flex-1 flex items-center justify-center p-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative mb-8"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-[#74AA9C]/20 to-[#5a8a7d]/20 rounded-3xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-[#74AA9C]/20 shadow-2xl">
                    <Users className="w-16 h-16 text-[#74AA9C]" />
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-[#74AA9C]/5 rounded-full blur-3xl -z-10"></div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Welcome to Study Groups
                  </h2>
                  <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-xl mx-auto">
                    Create or join study groups to collaborate with classmates, share resources, 
                    and engage in real-time discussions to enhance your learning experience.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                >
                  <motion.button
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 20px 40px rgba(116, 170, 156, 0.4)" 
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="group relative bg-gradient-to-r from-[#74AA9C] to-[#5a8a7d] hover:from-[#5a8a7d] hover:to-[#74AA9C] px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-300 flex items-center gap-3 shadow-2xl min-w-[200px] justify-center"
                  >
                    <Users className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    Create New Group
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: "rgba(55, 65, 81, 0.8)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={showJoinModal}
                    className="group bg-gray-700/60 hover:bg-gray-600/80 backdrop-blur-sm px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-300 flex items-center gap-3 border border-gray-600/50 hover:border-[#74AA9C]/30 shadow-xl min-w-[200px] justify-center"
                  >
                    <UserPlus className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    Join Existing Group
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                >
                  {[
                    { icon: MessageCircle, title: "Real-time Chat", desc: "Instant messaging with your study group" },
                    { icon: Users, title: "Collaborative", desc: "Work together on shared resources" },
                    { icon: Crown, title: "Organized", desc: "Structured groups with clear ownership" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.2 }}
                      className="text-center p-6 bg-gray-900/40 rounded-xl border border-gray-700/50 backdrop-blur-sm"
                    >
                      <div className="w-12 h-12 bg-[#74AA9C]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="w-6 h-6 text-[#74AA9C]" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(116, 170, 156, 0.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(116, 170, 156, 0.5);
        }
      `}</style>
    </div>
  );
};

export default StudyGroup;