import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase.config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [mongoUid, setMongoUid] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 UserContext: Setting up Firebase auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase Auth State Changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        console.log('👤 Firebase User UID:', firebaseUser.uid);

        // Set Firebase UID
        setFirebaseUid(firebaseUser.uid);

        // Get JWT token from Firebase
        try {
          const token = await firebaseUser.getIdToken();
          setJwtToken(token);
          console.log('🔑 JWT Token obtained');
        } catch (error) {
          console.error('💥 Error getting JWT token:', error);
        }

        try {
          console.log('📡 Fetching user from MongoDB...');
          const response = await fetch(`http://localhost:5000/api/auth/user/${firebaseUser.uid}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📡 MongoDB Response:', data);
          
          if (data.success && data.user) {
            console.log('✅ User found in MongoDB');
            setMongoUid(data.user._id);
            window.localStorage.setItem('userEmail', data.user.email);
            console.log('💾 MongoDB UID set:', data.user._id);
          } else {
            console.log('❌ User not found, creating new user...');
            
            const userData = {
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || null,
              phoneNumber: firebaseUser.phoneNumber || null,
              isEmailVerified: firebaseUser.emailVerified || false,
              provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
            };
            
            console.log('📝 Creating user with data:', userData);
            
            const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            });
            
            if (!registerResponse.ok) {
              throw new Error(`HTTP error! status: ${registerResponse.status}`);
            }
            
            const registerData = await registerResponse.json();
            console.log('📝 Registration Response:', registerData);
            
            if (registerData.success && registerData.user) {
              console.log('✅ User created successfully');
              setMongoUid(registerData.user._id);
              window.localStorage.setItem('userEmail', registerData.user.email);
              console.log('💾 MongoDB UID set after creation:', registerData.user._id);
            } else {
              throw new Error('Failed to create user in MongoDB');
            }
          }
        } catch (error) {
          console.error('💥 Error syncing user:', error);
          toast.error('Error syncing user data. Please try again.');
          
          // Keep Firebase UID and JWT even if MongoDB sync fails
          setMongoUid(null);
        }
      } else {
        console.log('🚪 No Firebase user, clearing all data');
        setFirebaseUid(null);
        setMongoUid(null);
        setJwtToken(null);
      }
      
      setLoading(false);
      console.log('⏳ Loading set to false');
    });

    return () => {
      console.log('🛑 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  // Log state changes after they occur
  useEffect(() => {
    console.log('📊 UserContext State Updated:', {
      mongoUid: mongoUid || 'None',
      firebaseUid: firebaseUid || 'None',
      hasJwtToken: !!jwtToken,
      jwtTokenLength: jwtToken?.length || 0,
      loading
    });
  }, [mongoUid, firebaseUid, jwtToken, loading]);

  const logout = async () => {
    console.log('🚪 Logout initiated');
    setLoading(true);
    
    try {
      await signOut(auth);
      setFirebaseUid(null);
      setMongoUid(null);
      setJwtToken(null);
      console.log('✅ Logout successful, cleared all IDs and token');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('💥 Logout error:', error);
      toast.error('Error logging out');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true); // Force refresh
        setJwtToken(token);
        console.log('🔄 JWT Token refreshed');
        return token;
      } catch (error) {
        console.error('💥 Error refreshing token:', error);
        return null;
      }
    }
    return null;
  };

  const value = {
    mongoUid,
    firebaseUid,
    jwtToken,
    loading,
    logout,
    refreshToken
  };

  console.log('🎯 UserContext Value being provided:', {
    mongoUid: value.mongoUid || 'None',
    firebaseUid: value.firebaseUid || 'None',
    hasJwtToken: !!value.jwtToken,
    loading: value.loading
  });

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
