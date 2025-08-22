import User from '../model/user.js';

// Get all users (for group member selection)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'displayName email photoURL createdAt')
      .sort({ displayName: 1 })
      .limit(100); // Limit to prevent performance issues
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

// Search users by email or name
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
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
      count: users.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId, 'displayName email photoURL createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, photoURL } = req.body;

    const updateData = {};
    if (displayName) updateData.displayName = displayName.trim();
    if (photoURL) updateData.photoURL = photoURL;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: 'displayName email photoURL createdAt' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
};