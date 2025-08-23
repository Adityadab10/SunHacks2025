import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Home, BookOpen, BarChart3, Settings, LogOut, User, Upload, Target, Zap, MessageCircle, Globe, Sparkles, Languages, Check } from "lucide-react";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(116, 170, 156, 0.1);
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(116, 170, 156, 0.3);
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(116, 170, 156, 0.5);
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../../firebase.config';

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={`h-screen px-4 py-4 hidden md:flex md:flex-col bg-black/90 backdrop-blur-xl border-r border-gray-800/50 shrink-0 sticky top-0 shadow-2xl ${className || ''}`}
      animate={{
        width: animate ? (open ? "300px" : "80px") : "300px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#74AA9C]/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 -right-10 w-32 h-32 bg-gradient-to-tl from-[#74AA9C]/5 to-transparent rounded-full blur-2xl"></div>
      </div>
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Mobile Header */}
      <div
        className={`h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-black/90 backdrop-blur-xl border-b border-gray-800/50 w-full sticky top-0 z-40 ${className || ''}`}
        {...props}
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo for mobile */}
          <div className="font-normal flex space-x-3 items-center text-sm text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7e] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">PadhAI</span>
          </div>

          <div
            className="p-2 rounded-xl bg-gray-800/50 border border-gray-700/50 cursor-pointer hover:bg-gray-700/50 transition-all duration-200"
            onClick={() => setOpen(!open)}
          >
            <Menu className="text-white h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={`fixed h-full w-full inset-0 bg-black/95 backdrop-blur-xl p-6 z-[100] flex flex-col justify-between md:hidden ${className || ''}`}
          >
            {/* Background decorative elements for mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 -left-10 w-60 h-60 bg-gradient-to-br from-[#74AA9C]/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 -right-10 w-40 h-40 bg-gradient-to-tl from-[#74AA9C]/5 to-transparent rounded-full blur-2xl"></div>
            </div>
            
            <div
              className="absolute right-6 top-6 z-50 p-2 rounded-xl bg-gray-800/50 border border-gray-700/50 cursor-pointer hover:bg-gray-700/50 transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5 text-white" />
            </div>
            
            <div className="relative z-10 h-full">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({ link, className, onClick, ...props }) => {
  const { open, animate, setOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    } else if (link.onClick) {
      link.onClick();
    } else if (link.href && link.href !== "#") {
      // Navigate to the link if it's not a special action
      navigate(link.href);
    }

    // For mobile, close the sidebar after clicking a link
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  // Check if this link is currently active
  const isActive = location.pathname === link.href;

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-start gap-4 group/sidebar py-3.5 px-3 rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden ${
        isActive 
          ? 'bg-gradient-to-r from-[#74AA9C]/20 to-[#74AA9C]/5 border border-[#74AA9C]/30 text-[#74AA9C] shadow-lg shadow-[#74AA9C]/10' 
          : 'hover:bg-gray-800/50 text-gray-300 hover:border-gray-700/50 border border-transparent'
      } ${link.className || ''} ${className || ''}`}
      {...props}
    >
      {/* Active indicator - subtle glow effect */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-[#74AA9C]/10 via-[#74AA9C]/5 to-transparent rounded-xl"
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      )}

      <div className={`flex-shrink-0 relative z-10 transition-all duration-300 ${
        isActive 
          ? 'text-[#74AA9C] transform scale-110' 
          : 'text-gray-400 group-hover/sidebar:text-[#74AA9C] group-hover/sidebar:scale-105'
      }`}>
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className={`text-sm font-medium transition-all duration-300 whitespace-pre inline-block !p-0 !m-0 relative z-10 ${
          isActive 
            ? 'text-[#74AA9C]' 
            : 'text-gray-300 group-hover/sidebar:text-white group-hover/sidebar:translate-x-1'
        }`}
      >
        {link.label}
      </motion.span>

      {/* Hover glow effect */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 pointer-events-none ${
        !isActive ? 'bg-gradient-to-r from-[#74AA9C]/5 to-transparent' : ''
      }`} />

      {/* Tooltip for collapsed state */}
      {animate && !open && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800/90 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap border border-gray-700/50 shadow-lg">
          {link.label}
          <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800/90 border-l border-b border-gray-700/50 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Main Sidebar Component
const MainSidebar = () => {
  const { logout } = useUser();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const { translations } = useLanguage();

  const navigationLinks = [
    {
      label: translations.dashboard || "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: translations.profile || "My Profile",
      href: "/profile", 
      icon: <User className="w-5 h-5" />,
    },
    {
      label: translations.upload || "Upload Materials",
      href: "/upload",
      icon: <Upload className="w-5 h-5" />,
    },
    {
      label: translations.youtube || "YouTube Summarizer",
      href: "/youtube",
      icon: <Globe className="w-5 h-5" />,
    },
    {
      label: translations.studyGroup || "Study Group",
      href: "/study-group",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      label: translations.publicBoards || "Public Study Boards",
      href: "/public-studyboards",
      icon: <Globe className="w-5 h-5" />,
    },
  ];

  return (
    <Sidebar>
      <SidebarBody>
        <SidebarContent 
          navigationLinks={navigationLinks}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </SidebarBody>
    </Sidebar>
  );
};

// Separate component that uses the sidebar context
// Language selector component
const LanguageSelector = ({ isOpen }) => {
  const [showLanguages, setShowLanguages] = useState(false);
  const { currentLanguage, changeLanguage, isLoading } = useLanguage();

  const languages = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी',
    fr: 'Français'
  };

  const handleLanguageChange = async (langCode) => {
    setShowLanguages(false);
    await changeLanguage(langCode);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowLanguages(!showLanguages)}
        className="w-full flex items-center gap-2 p-3 rounded-xl bg-gray-800/30 border border-gray-700/30 text-gray-300 hover:text-white hover:bg-gray-700/30 transition-all duration-200"
      >
        <Languages className="w-5 h-5 text-[#74AA9C]" />
        {isOpen && (
          <span className="text-sm font-medium flex-1 text-left">
            {languages[currentLanguage]}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showLanguages && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-0 w-full bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700/50 py-2 shadow-xl"
          >
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#74AA9C]/20 transition-colors"
              >
                {currentLanguage === code && (
                  <Check className="w-4 h-4 text-[#74AA9C]" />
                )}
                <span className={currentLanguage === code ? "text-[#74AA9C]" : ""}>
                  {name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarContent = ({ navigationLinks, currentUser, onLogout }) => {
  const { open } = useSidebar();
  const { translations } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center gap-4 mb-10 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-[#74AA9C] to-[#5a8a7e] rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <motion.div
          animate={{
            opacity: open ? 1 : 0,
            display: open ? "block" : "none",
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            PadhAI
          </h1>
          <p className="text-xs text-gray-400 mt-1">{translations.aiPowered || "AI-Powered Learning"}</p>
        </motion.div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {navigationLinks.map((link, index) => (
          <SidebarLink key={index} link={link} />
        ))}
      </nav>

      {/* Language Selector */}
      <div className="mb-4">
        <LanguageSelector isOpen={open} />
      </div>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-800/50 pt-6 mt-6">
        <div className={`flex items-center gap-2 ${!open ? 'p-2' : 'p-3'} rounded-xl bg-gray-800/30 border border-gray-700/30 transition-all duration-300`}>
          <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden transform-gpu">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full border-2 border-[#74AA9C]/30"
                style={{ aspectRatio: '1', objectPosition: 'center' }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          <motion.div
            animate={{
              width: open ? 'auto' : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className="overflow-hidden flex-1 min-w-0"
          >
            <p className="text-sm font-semibold text-white truncate">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {currentUser?.email}
            </p>
          </motion.div>
        </div>
        
        <SidebarLink
          link={{
            label: translations.signOut || "Sign Out",
            href: "#",
            icon: <LogOut className="w-5 h-5" />,
            onClick: onLogout,
          }}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-800/30"
        />
      </div>
    </div>
  );
};

export default MainSidebar;