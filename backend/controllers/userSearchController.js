import User from '../model/user.js';

// Search users by email (partial match)
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    // Case-insensitive partial match
    const users = await User.find({ email: { $regex: email, $options: 'i' } }, 'displayName email photoURL');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
