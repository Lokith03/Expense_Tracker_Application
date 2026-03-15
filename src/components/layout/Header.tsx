import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LogOut,
  Sun,
  Moon,
  Search,
  ChevronDown,
  UserCircle,
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 px-4 lg:px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left side - Greeting */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {getGreeting()}, {user?.username}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your expenses and manage your finances with ease.
            </p>
          </motion.div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="hidden md:flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-transparent border-0 outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 w-32 lg:w-48"
            />
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500" />
            )}
          </motion.button>

          {/* Notifications */}
          {/* <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            />
          </motion.button> */}

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
            >
              {user?.user_image && !imgError ? (
                <img
                  src={
                    user.user_image?.startsWith('http')
                      ? user.user_image
                      : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${user.user_image.startsWith('/') ? '' : '/'}${user.user_image}`
                  }
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-16 right-4 w-50 bg-[#0f172a] rounded-xl shadow-2xl border border-blue-900/20 overflow-hidden"
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* <div className="p-4 bg-[#1e293b]/40 border-b border-blue-900/20">
                    <h3 className="text-lg font-medium text-white/90">{user?.username}</h3>
                    <p className="text-sm text-blue-300/70">{user?.email}</p>
                  </div> */}

                  <div className="p-2">
                    {/* <motion.button
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      onClick={() => {
                        setDropdownOpen(false);
                        // Navigate to profile
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[15px] text-blue-100/90 rounded-lg hover:bg-blue-500/5 active:bg-blue-500/10 transition-all"
                    >
                      <User className="w-5 h-5 text-blue-400/90" />
                      <span>Profile Settings</span>
                    </motion.button> */}

                    {/* <motion.button
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[15px] text-blue-100/90 rounded-lg hover:bg-blue-500/5 active:bg-blue-500/10 transition-all"
                    >
                      <Settings className="w-5 h-5 text-blue-400/90" />
                      <span>Preferences</span>
                    </motion.button> */}

                    {/* <div className="my-2 border-t border-blue-900/20" /> */}

                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[15px] text-red-100/90 rounded-lg hover:bg-red-500/5 active:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-5 h-5 text-red-400/90" />
                      <span>Sign Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
