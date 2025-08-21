import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';

const Navbar = () => {
  const { firebaseUid, logout } = useUser();
  
  // Get current Firebase user for display data
  const currentUser = auth.currentUser;

  return (
    <nav className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white">
          PadhAI
        </Link>
        
        <div className="flex items-center space-x-4">
          {firebaseUid ? (
            <>
              <Link 
                to="/dashboard" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
                <span className="text-white text-sm">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-x-4">
              <Link 
                to="/login" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
