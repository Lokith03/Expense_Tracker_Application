import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, TrendingDown, BarChart3, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/income', icon: TrendingUp, label: 'Income' },
    { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
    { to: '/analytics', icon: BarChart3, label: 'Stats' },
    { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNav: React.FC = () => {
    const { user } = useAuth();

    // Create specific items list based on role
    const items = [
        ...navItems,
        ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : [])
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 lg:hidden z-50 rounded-t-2xl pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
            <nav className="flex justify-around items-center h-16 px-2">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    initial={false}
                                    animate={{ y: isActive ? -2 : 0 }}
                                >
                                    <item.icon
                                        className={`w-6 h-6 transition-all duration-300 ${isActive ? 'fill-current opacity-100 scale-110' : 'opacity-70 scale-100'}`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavDot"
                                            className="absolute -bottom-2 left-1/2 w-1 h-1 bg-current rounded-full -translate-x-1/2"
                                        />
                                    )}
                                </motion.div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default BottomNav;
