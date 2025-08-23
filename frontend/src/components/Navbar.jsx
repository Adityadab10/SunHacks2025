import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { auth } from '../../firebase.config';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

// Simple utility function for classNames
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Navbar = ({ isDarkMode = true }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUid, logout } = useUser();
  const { t } = useTranslation();
  
  // Get current Firebase user for display data
  const currentUser = auth.currentUser;
  
  // Navigation items for non-authenticated users
  const publicNavItems = [
    { name: t("Features"), link: "#features" },
    { name: t("About"), link: "#about" },
    { name: t("Contact"), link: "#contact" }
  ];

  // Navigation items for authenticated users
  const privateNavItems = [
    { name: t("Dashboard"), link: "/dashboard" },
    { name: t("Courses"), link: "#courses" },
    { name: t("Progress"), link: "#progress" },
    { name: t("Settings"), link: "#settings" }
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

  // Theme-aware styling - OPPOSITE to landing page for contrast
  // Match hero section: dark background, green accent, border
  const navTheme = {
    bg: "#111827", // Tailwind's bg-gray-900
    bgVisible: "#111827",
    text: "text-white",
    textSecondary: "text-gray-400",
    border: "border-2 border-[#74AA9C]", // Green accent border
    borderVisible: "border-2 border-[#74AA9C]",
    hoverBg: "bg-gray-800 hover:bg-[#74AA9C]/20",
    buttonPrimary: "bg-[#74AA9C] text-black hover:bg-[#74AA9C]/90",
    buttonSecondary: "text-[#74AA9C] hover:text-white",
  };

  return (
    <motion.div
      ref={ref}
  className="fixed inset-x-0 top-0 z-50 max-w-6xl mx-auto"
  style={{ background: navTheme.bg, borderBottom: '2px solid #74AA9C', boxShadow: '0 2px 16px 0 rgba(116,170,156,0.10)' }}
    >
      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(16px)" : "blur(8px)",
          y: visible ? 16 : 0,
          backgroundColor: navTheme.bg,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        }}
        style={{
          borderBottom: '2px solid #74AA9C',
          boxShadow: '0 2px 16px 0 rgba(116,170,156,0.10)',
        }}
        className={cn(
          "relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between rounded-full px-8 py-3 md:flex border-2 border-[#74AA9C] bg-gray-900",
          "shadow-lg"
        )}
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
            className={cn("text-lg font-bold tracking-wider", navTheme.text)}
          >
            <Link to={firebaseUid ? "/dashboard" : "/"}>
              {t("PadhAI")}
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
              <NavItem 
                key={idx} 
                item={item} 
                onNavigate={scrollToSection}
                textColor={navTheme.text}
                isDarkMode={isDarkMode}
              />
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
                  <User className={cn("w-6 h-6", navTheme.text)} />
                )}
                <span className={cn("text-sm", navTheme.text)}>
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                <LanguageSelector />
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
                    className={cn(
                      "px-4 py-2 transition-colors text-sm font-medium",
                      navTheme.buttonSecondary
                    )}
                  >
                    {t("Login")}
                  </Link>
                </motion.div>
                <LanguageSelector />
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
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium inline-block tracking-wide transition-colors",
                      navTheme.buttonPrimary
                    )}
                  >
                    {t("Signup")}
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
          backdropFilter: visible ? "blur(16px)" : "blur(8px)",
          y: visible ? 16 : 0,
          backgroundColor: navTheme.bg,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        style={{
          borderBottom: '2px solid #74AA9C',
          boxShadow: '0 2px 16px 0 rgba(116,170,156,0.10)',
        }}
        className={cn(
          "md:hidden flex items-center justify-between px-6 py-3 mx-6 rounded-full border-2 border-[#74AA9C] bg-gray-900",
          "shadow-lg"
        )}
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
          className={cn("text-lg font-bold tracking-wider", navTheme.text)}
        >
          <Link to={firebaseUid ? "/dashboard" : "/"}>
            {t("PadhAI")}
          </Link>
        </motion.h1>

        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn("text-xl p-1", navTheme.text)}
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
            <div 
              className="backdrop-blur-xl border rounded-2xl p-4 space-y-2 shadow-2xl"
              style={{ 
                backgroundColor: navTheme.bgVisible,
                borderColor: isDarkMode ? 'rgba(229, 231, 235, 0.2)' : 'rgba(75, 85, 99, 0.2)'
              }}
            >
              {navItems.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  onClick={() => scrollToSection(item.link)}
                  className={cn(
                    "block w-full text-left py-2 px-3 rounded-xl transition-colors tracking-wide",
                    navTheme.text,
                    isDarkMode ? "hover:bg-gray-100" : "hover:bg-gray-800"
                  )}
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
                <motion.div 
                  className="flex items-center justify-between p-3 mt-3 rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(243, 244, 246, 0.5)' : 'rgba(31, 41, 55, 0.5)' }}
                >
                  <div className="flex items-center space-x-3">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className={cn("w-6 h-6", navTheme.text)} />
                    )}
                    <span className={cn("text-sm", navTheme.text)}>
                      {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors"
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
                      className={cn(
                        "block w-full px-4 py-2 rounded-xl text-center font-medium tracking-wide transition-colors border",
                        navTheme.text,
                        isDarkMode ? "border-gray-300 hover:bg-gray-100" : "border-gray-600 hover:bg-gray-800"
                      )}
                    >
                      {t("Login")}
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
                      className={cn(
                        "block w-full px-4 py-2 rounded-xl text-center font-medium tracking-wide transition-colors",
                        navTheme.buttonPrimary
                      )}
                    >
                      {t("Register")}
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
const NavItem = ({ item, onNavigate, textColor, isDarkMode }) => {
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
      className={cn("relative px-3 py-2 text-sm font-medium tracking-wide", textColor)}
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
        className={cn(
          "absolute inset-0 rounded-full",
          isDarkMode ? "bg-gray-200" : "bg-gray-700"
        )}
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