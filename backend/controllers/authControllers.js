import User from '../model/user.js';

export const registerUser = async (req, res) => {
  try {
    console.log('📝 Register User Request:', req.body);
    const { firebaseUid, email, displayName, photoURL, phoneNumber, isEmailVerified, provider } = req.body;

    if (!firebaseUid || !email || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firebaseUid, email, displayName'
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ firebaseUid });
    
    if (existingUser) {
      console.log('👤 User already exists, updating last login');
      existingUser.lastLogin = new Date();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        user: existingUser
      });
    }

    // Create new user
    const newUser = new User({
      firebaseUid,
      email,
      displayName,
      photoURL,
      phoneNumber,
      isEmailVerified,
      provider
    });

    await newUser.save();
    console.log('✅ New user created:', newUser._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });

  } catch (error) {
    console.error('💥 Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

export const getUserByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    console.log('🔍 Looking for user with Firebase UID:', firebaseUid);
    
    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user._id);
    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('💥 Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
