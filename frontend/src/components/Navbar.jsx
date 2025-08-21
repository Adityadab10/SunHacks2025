import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';

// Simple utility function for classNames
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Navbar = () => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUid, logout } = useUser();
  
  // Get current Firebase user for display data
  const currentUser = auth.currentUser;
  
  // Navigation items for non-authenticated users
  const publicNavItems = [
    { name: "Features", link: "#features" },
    { name: "About", link: "#about" },
    { name: "Contact", link: "#contact" }
  ];

  // Navigation items for authenticated users
  const privateNavItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Courses", link: "#courses" },
    { name: "Progress", link: "#progress" },
    { name: "Settings", link: "#settings" }
  ];

  const navItems = firebaseUid ? privateNavItems : publicNavItems;

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const scrollToSection = (sectionId) => {
    if (sectionId.startsWith('#')) {
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 max-w-6xl mx-auto"
    >
      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(16px)" : "none",
          border: visible ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          width: visible ? "65%" : "80%",
          y: visible ? 16 : 0,
          backgroundColor: visible
            ? "rgba(0, 0, 0, 0.8)"
            : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        }}
        style={{
          minWidth: visible ? "700px" : "600px",
        }}
        className="relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between rounded-full px-8 py-3 md:flex"
      >
        <div className="flex w-full items-center justify-between">
          <motion.h1
            animate={{
              scale: visible ? 0.85 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="text-lg font-bold text-white tracking-wider"
          >
            <Link to={firebaseUid ? "/dashboard" : "/"}>
              {visible ? "PadhAI" : "PadhAI"}
            </Link>
          </motion.h1>

          <motion.nav
            animate={{
              opacity: 1,
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-1"
          >
            {navItems.map((item, idx) => (
              <NavItem key={idx} item={item} onNavigate={scrollToSection} />
            ))}
          </motion.nav>

          <motion.div
            animate={{
              scale: visible ? 0.9 : 1,
            }}
            className="flex items-center space-x-3"
          >
            {firebaseUid ? (
              <>
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
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-white hover:text-gray-300 transition-colors text-sm font-medium"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  <Link 
                    to="/register" 
                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium inline-block tracking-wide hover:bg-gray-200 transition-colors"
                  >
                    Register
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(16px)" : "none",
          border: visible ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          y: visible ? 16 : 0,
          backgroundColor: visible
            ? "rgba(0, 0, 0, 0.8)"
            : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        className="md:hidden flex items-center justify-between px-6 py-3 mx-6 rounded-full"
      >
        <motion.h1
          animate={{
            scale: visible ? 0.85 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className="text-lg font-bold text-white tracking-wider"
        >
          <Link to={firebaseUid ? "/dashboard" : "/"}>
            PadhAI
          </Link>
        </motion.h1>

        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-xl p-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
          }}
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </motion.button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 mx-6"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2 shadow-2xl">
              {navItems.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  onClick={() => scrollToSection(item.link)}
                  className="block w-full text-left text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors tracking-wide"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ x: 4 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  {item.name}
                </motion.a>
              ))}

              {firebaseUid ? (
                <motion.div className="flex items-center justify-between p-3 mt-3 bg-white/5 rounded-xl">
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
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-2 mt-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-2 rounded-xl text-center text-white border border-white/20 font-medium tracking-wide hover:bg-white/10 transition-colors"
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-2 rounded-xl text-center text-black bg-white font-medium tracking-wide hover:bg-gray-200 transition-colors"
                    >
                      Register
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Navigation Item with hover effect
const NavItem = ({ item, onNavigate }) => {
  return (
    <motion.a
      href={item.link}
      onClick={(e) => {
        e.preventDefault();
        if (item.link.startsWith('/')) {
          // Handle React Router navigation
          window.location.href = item.link;
        } else {
          onNavigate(item.link);
        }
      }}
      className="relative px-3 py-2 text-sm font-medium text-white tracking-wide"
      whileHover="hover"
      initial="initial"
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
    >
      <span className="relative z-10">{item.name}</span>
      <motion.span 
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0.8, opacity: 0 }}
        variants={{
          initial: { scale: 0.8, opacity: 0 },
          hover: { scale: 1, opacity: 1 }
        }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 25,
        }}
      />
    </motion.a>
  );
};

export default Navbar;
