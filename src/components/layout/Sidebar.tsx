import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  User,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck as ShieldCode
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-500' },
  { to: '/income', icon: TrendingUp, label: 'Income', color: 'text-green-500' },
  { to: '/expenses', icon: TrendingDown, label: 'Expenses', color: 'text-red-500' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-purple-500' },
  { to: '/profile', icon: User, label: 'Profile', color: 'text-indigo-500' },
];

import AddIncomeModal from '../modals/AddIncomeModal';
import AddExpenseModal from '../modals/AddExpenseModal';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="w-64 h-screen bg-white/10 dark:bg-gray-900/20 backdrop-blur-md border-r border-white/20 dark:border-gray-700/30"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center py-6 px-4 border-b border-white/10 dark:border-gray-700/20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <Wallet className="w-8 h-8 text-blue-500" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                ExpenseTracker
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pro</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.to;
            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  </motion.div>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                    />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
          {user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navItems.length * 0.1 }}
            >
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r"
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                      />
                    )}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                      <ShieldCode className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
                    </motion.div>
                    <span className="font-medium">Admin Panel</span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          )}
        </nav>

        {/* Quick Stats */}
        <div className="px-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quick Actions</span>
            </div>
            <div className="flex space-x-2">
              <motion.button
                onClick={() => setIsIncomeModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center space-x-1 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                <ArrowUpCircle className="w-3 h-3" />
                <span>Income</span>
              </motion.button>
              <motion.button
                onClick={() => setIsExpenseModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center space-x-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                <ArrowDownCircle className="w-3 h-3" />
                <span>Expense</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Add the modals */}
        <AddIncomeModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={() => setIsIncomeModalOpen(false)}
        />
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => setIsExpenseModalOpen(false)}
        />

        {/* Footer */}
        <div className="px-4 pb-4 border-t border-white/10 dark:border-gray-700/20 pt-4">
          <motion.a
            href="www.linkedin.com/in/lokithaksha03"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="block text-center text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            © 2026 LokithAksha
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;