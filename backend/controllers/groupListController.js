import Group from '../model/group.js';
import User from '../model/user.js';

// Get groups by member email
export const getGroupsByMember = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const groups = await Group.find({ members: user._id }).populate('members', 'displayName email photoURL');
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
