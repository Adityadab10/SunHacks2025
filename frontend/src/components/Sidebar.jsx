import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Home, BookOpen, BarChart3, Settings, LogOut, User, Upload, Target, Zap, MessageCircle, Globe } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../context/UserContext';
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
      className={`h-screen px-4 py-4 hidden md:flex md:flex-col bg-gray-900 border-r border-gray-700 shrink-0 sticky top-0 ${className || ''}`}
      animate={{
        width: animate ? (open ? "280px" : "70px") : "280px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Mobile Header */}
      <div
        className={`h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-gray-900 border-b border-gray-700 w-full sticky top-0 z-40 ${className || ''}`}
        {...props}
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo for mobile */}
          <div className="font-normal flex space-x-2 items-center text-sm text-white">
            <BookOpen className="w-6 h-6 text-green-400 flex-shrink-0" />
            <span className="font-medium text-white">StudyGenie</span>
          </div>

          <Menu
            className="text-white h-6 w-6 cursor-pointer hover:text-gray-300 transition-colors"
            onClick={() => setOpen(!open)}
          />
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
            className={`fixed h-full w-full inset-0 bg-gray-900 p-6 z-[100] flex flex-col justify-between md:hidden ${className || ''}`}
          >
            <div
              className="absolute right-6 top-6 z-50 text-white cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => setOpen(false)}
            >
              <X className="h-6 w-6" />
            </div>
            {children}
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
      className={`flex items-center justify-start gap-3 group/sidebar py-3 px-2 rounded-lg transition-all duration-200 cursor-pointer relative ${
        isActive 
          ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
          : 'hover:bg-gray-800 text-gray-300'
      } ${className || ''}`}
      {...props}
    >
      <div className={`flex-shrink-0 relative z-10 transition-colors ${
        isActive ? 'text-green-400' : 'text-gray-300 group-hover/sidebar:text-green-400'
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
        className={`text-sm transition-all duration-200 whitespace-pre inline-block !p-0 !m-0 relative z-10 ${
          isActive ? 'text-green-400' : 'text-gray-300 group-hover/sidebar:text-white group-hover/sidebar:translate-x-1'
        }`}
      >
        {link.label}
      </motion.span>

      {/* Tooltip for collapsed state */}
      {animate && !open && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap border border-gray-700">
          {link.label}
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

  const navigationLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: "My Profile",
      href: "/profile", 
      icon: <User className="w-5 h-5" />,
    },
    {
      label: "My Courses",
      href: "/courses",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "Upload Materials",
      href: "/upload",
      icon: <Upload className="w-5 h-5" />,
    },
    {
      label: "YouTube Summarizer",
      href: "/youtube",
      icon: <Globe className="w-5 h-5" />,
    },
    {
      label: "Study Flow",
      href: "/study-flow",
      icon: <Target className="w-5 h-5" />,
    },
    {
      label: "Flashcards",
      href: "/flashcards",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      label: "AI Tutor",
      href: "/ai-tutor",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      label: "Progress",
      href: "/progress",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
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
const SidebarContent = ({ navigationLinks, currentUser, onLogout }) => {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-green-400" />
        <motion.span
          animate={{
            opacity: open ? 1 : 0,
            display: open ? "inline-block" : "none",
          }}
          className="text-xl font-bold text-white"
        >
          StudyGenie
        </motion.span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navigationLinks.map((link, index) => (
          <SidebarLink key={index} link={link} />
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-3 mb-4">
          {currentUser?.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
          <motion.div
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "block" : "none",
            }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium text-white truncate">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {currentUser?.email}
            </p>
          </motion.div>
        </div>
        
        <SidebarLink
          link={{
            label: "Logout",
            href: "#",
            icon: <LogOut className="w-5 h-5" />,
            onClick: onLogout,
          }}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        />
      </div>
    </div>
  );
};

export default MainSidebar;
