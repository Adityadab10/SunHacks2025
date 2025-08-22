import User from '../model/user.js';

// Search user by email
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    // Search for exact email match first, then partial matches
    const exactMatch = await User.findOne(
      { email: email.toLowerCase() },
      'displayName email photoURL createdAt'
    );

    if (exactMatch) {
      return res.json({
        success: true,
        users: [exactMatch]
      });
    }

    // If no exact match, search for partial matches
    const emailRegex = new RegExp(email.trim(), 'i');
    const users = await User.find(
      { email: emailRegex },
      'displayName email photoURL createdAt'
    )
    .limit(10)
    .sort({ email: 1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching user by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search user'
    });
  }
};

// Search users by name or email
export const searchUsersByQuery = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      $or: [
        { email: searchRegex },
        { displayName: searchRegex }
      ]
    }, 'displayName email photoURL createdAt')
    .limit(20)
    .sort({ displayName: 1 });

    res.json({
      success: true,
      users,
      query: q.trim()
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};
