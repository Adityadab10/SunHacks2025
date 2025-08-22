import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const ModernNavbar = ({ isDarkMode, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { name: t('Home'), path: '/' },
    { name: t('Demo'), path: '/demo' },
    { name: t('Features'), path: '/#features' },
    { name: t('About'), path: '/about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-white to-[#74AA9C] bg-clip-text text-transparent"
            >
              {t('PadhAI')}
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className="text-gray-300 hover:text-[#74AA9C] transition-colors duration-300 font-medium"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-[#74AA9C] transition-all duration-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            <Link
              to="/waitlist"
              className="bg-[#74AA9C] hover:bg-[#74AA9C]/90 text-black px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105"
            >
              {t('Join Waitlist')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-[#74AA9C] transition-all duration-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-[#74AA9C] transition-colors duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-900/95 backdrop-blur-md rounded-lg mt-2 mb-4 border border-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block px-3 py-2 text-gray-300 hover:text-[#74AA9C] hover:bg-gray-800/50 rounded-md transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/waitlist"
                className="block px-3 py-2 mt-4 bg-[#74AA9C] text-black rounded-md font-semibold text-center hover:bg-[#74AA9C]/90 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('Join Waitlist')}
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default ModernNavbar;
