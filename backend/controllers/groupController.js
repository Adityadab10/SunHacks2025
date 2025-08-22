import Group from '../model/group.js';
import User from '../model/user.js';

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, ownerEmail } = req.body;
    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });
    
    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) isUnique = true;
    }
    
    const group = new Group({ 
      name, 
      owner: owner._id, 
      members: [owner._id],
      inviteCode
    });
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Join group with invite code
export const joinGroupWithCode = async (req, res) => {
  try {
    const { inviteCode, email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const group = await Group.findOne({ inviteCode });
    if (!group) return res.status(404).json({ success: false, message: 'Invalid invite code' });
    
    if (group.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User already in group' });
    }
    
    group.members.push(user._id);
    await group.save();
    
    res.json({ success: true, group: { name: group.name, _id: group._id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get groups by member email
export const getGroupsByMember = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const groups = await Group.find({ members: user._id })
      .populate('owner', 'displayName email')
      .populate('members', 'displayName email photoURL')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add member to group by email
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.members.includes(user._id)) return res.status(400).json({ success: false, message: 'User already in group' });
    group.members.push(user._id);
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get group details (with member names)
export const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('members', 'displayName email photoURL')
      .populate('owner', 'displayName email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await Group.findByIdAndDelete(groupId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
