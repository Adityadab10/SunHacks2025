import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import MainSidebar from '../components/Sidebar';

const socket = io('http://localhost:5000');

const StudyGroup = () => {
  const { firebaseUid } = useUser();
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addedMembers, setAddedMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const [ownerEmail, setOwnerEmail] = useState('');

  useEffect(() => {
    // Get current user's email for group owner
    const user = window.localStorage.getItem('userEmail');
    setOwnerEmail(user || '');
    setCurrentUserEmail(user || '');
    // Fetch groups for logged-in user
    fetchUserGroups(user);
  }, []);

  // Fetch groups for logged-in user
  const fetchUserGroups = async (email) => {
    if (!email) return;
    // Backend should provide a route to get groups by member email
    const res = await fetch(`http://localhost:5000/api/group/groups-by-member?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setGroups(data.groups || []);
  };

  const createGroup = async () => {
    if (!groupName || !currentUserEmail) {
      toast.error('Group name and owner email required');
      return;
    }
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
      setGroupName('');
      setAddedMembers([]);
      setShowForm(false);
      fetchUserGroups(currentUserEmail);
      toast.success('Group created successfully');
    } else {
      toast.error(data.message || 'Failed to create group. Make sure your account exists.');
    }
  };
  // Search users by email
  const searchUser = async () => {
    if (!searchEmail) return;
    const res = await fetch(`http://localhost:5000/api/search-user?email=${encodeURIComponent(searchEmail)}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  };

  // Add user to group member list (before creation)
  const addUserToGroup = (user) => {
    if (!addedMembers.some(m => m._id === user._id)) {
      setAddedMembers([...addedMembers, user]);
    }
  };

  // Remove user from group member list
  const removeUserFromGroup = (userId) => {
    setAddedMembers(addedMembers.filter(m => m._id !== userId));
  };

  const addMember = async () => {
    if (!selectedGroup || !memberEmail) return;
    const res = await fetch(`http://localhost:5000/api/group/group/${selectedGroup._id}/member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: memberEmail })
    });
    const data = await res.json();
    if (data.success) {
      setMemberEmail('');
      getGroupDetails(selectedGroup._id);
    }
  };

  const getGroupDetails = async (groupId) => {
    const res = await fetch(`http://localhost:5000/api/group/group/${groupId}`);
    const data = await res.json();
    if (data.success) {
      setSelectedGroup(data.group);
      setMembers(data.group.members);
      setMessages(data.group.messages || []);
      socket.emit('joinGroup', groupId);
    }
  };

  useEffect(() => {
    socket.on('receiveMessage', ({ groupId, message }) => {
      if (selectedGroup && groupId === selectedGroup._id) {
        setMessages((prev) => [...prev, message]);
      }
    });
    return () => {
      socket.off('receiveMessage');
    };
  }, [selectedGroup]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim() || !selectedGroup) return;
    socket.emit('sendMessage', {
      groupId: selectedGroup._id,
      senderId: firebaseUid,
      content: chatInput.trim()
    });
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <MainSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Study Groups</h1>
        {/* Create Group Button and Form */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 px-6 py-3 rounded mb-8">Create Group</button>
        ) : (
          <div className="mb-8 bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Create a Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white mr-2 mb-2"
            />
            <div className="mb-4">
              <input
                type="email"
                placeholder="Search user by email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                className="p-2 rounded bg-gray-800 text-white mr-2"
              />
              <button onClick={searchUser} className="bg-green-600 px-4 py-2 rounded">Search</button>
            </div>
            {/* Show search results */}
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                <ul>
                  {searchResults.map(user => (
                    <li key={user._id} className="mb-2 flex items-center">
                      {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-2" />}
                      <span className="mr-2">{user.displayName} ({user.email})</span>
                      <button onClick={() => addUserToGroup(user)} className="bg-blue-500 px-2 py-1 rounded">Add</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Show added members */}
            {addedMembers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Members to Add</h3>
                <ul>
                  {addedMembers.map(m => (
                    <li key={m._id} className="mb-1 flex items-center">
                      {m.photoURL && <img src={m.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-2" />}
                      <span className="mr-2">{m.displayName} ({m.email})</span>
                      <button onClick={() => removeUserFromGroup(m._id)} className="bg-red-500 px-2 py-1 rounded">Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={createGroup} className="bg-blue-600 px-4 py-2 rounded">Create Group</button>
            <button onClick={() => setShowForm(false)} className="ml-4 bg-gray-700 px-4 py-2 rounded">Cancel</button>
          </div>
        )}
        {/* Show user's groups */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Your Groups</h2>
          <ul>
            {groups.map(group => (
              <li key={group._id} className="mb-2">
                <button
                  className="text-blue-400 underline"
                  onClick={() => getGroupDetails(group._id)}
                >
                  {group.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Show selected group details and chat */}
        {selectedGroup && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Group: {selectedGroup.name}</h2>
            <h3 className="text-lg font-semibold mb-2">Members</h3>
            <ul>
              {members.map(m => (
                <li key={m._id} className="mb-1 flex items-center">
                  {m.photoURL && <img src={m.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-2" />}
                  <span>{m.displayName} ({m.email})</span>
                </li>
              ))}
            </ul>
            {/* Chat UI */}
            <div className="mt-8 bg-gray-800 rounded-lg p-4 max-w-xl">
              <h3 className="text-lg font-semibold mb-2">Group Chat</h3>
              <div className="h-64 overflow-y-auto bg-gray-900 rounded p-2 mb-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-2 flex ${msg.sender === firebaseUid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-lg ${msg.sender === firebaseUid ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                      <span>{msg.content}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 p-2 rounded bg-gray-700 text-white mr-2"
                  placeholder="Type a message..."
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button onClick={sendMessage} className="bg-green-600 px-4 py-2 rounded">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroup;
