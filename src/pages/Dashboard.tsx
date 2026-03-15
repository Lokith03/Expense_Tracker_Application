import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/common/Skeleton';
import AddIncomeModal from '../components/modals/AddIncomeModal';
import AddExpenseModal from '../components/modals/AddExpenseModal';

interface DashboardData {
  monthlyTotals: {
    income: number;
    expense: number;
    balance: number; // Total cumulative balance
    currentMonthBalance: number; // This month's balance only
    previousBalance: number; // Previous months' balance
  };
  categoryExpenses: Array<{
    name: string;
    value: number;
  }>;
  recentTransactions: Array<{
    type: 'income' | 'expense';
    amount: number;
    note: string;
    date: string;
    category?: string;
    subcategory?: string;
  }>;
  currentMonthCounts: {
    income: number;
    expense: number;
  };
  monthlyComparison: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleTransactionSuccess = () => {
    fetchDashboardData();
    setShowIncomeModal(false);
    setShowExpenseModal(false);
  };

  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (Jan=0)
  const currentYear = now.getFullYear();



  // Use all recent transactions for the list
  const recentTransactionsList = data?.recentTransactions || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your expenses and income with beautiful insights
          </p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl border border-green-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl border border-red-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(data.monthlyTotals.income)}
              </p>
              <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span className="text-sm">Current month</span>
              </div>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(data.monthlyTotals.expense)}
              </p>
              <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span className="text-sm">Current month</span>
              </div>
            </div>
            <div className="bg-red-500/20 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Previous Balance</p>
              <p className={`text-2xl font-bold mt-2 ${data.monthlyTotals.previousBalance >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {formatCurrency(data.monthlyTotals.previousBalance)}
              </p>
              <div className={`flex items-center mt-2 ${data.monthlyTotals.previousBalance >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                <Activity className="w-4 h-4 mr-1" />
                <span className="text-sm">Carried forward</span>
              </div>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center gap-1">
                Total Balance
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Previous + Current Month
                  </div>
                </div>
              </div>
              <p className={`text-2xl font-bold mt-2 ${data.monthlyTotals.balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {formatCurrency(data.monthlyTotals.balance)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${data.monthlyTotals.currentMonthBalance >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {data.monthlyTotals.currentMonthBalance >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                <span>{formatCurrency(Math.abs(data.monthlyTotals.currentMonthBalance))} this month</span>
              </div>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Expense Categories (This Month)
          </h3>
          {data.categoryExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No expense data available for this month
            </div>
          )}
        </motion.div>

        {/* Balance Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Balance Trend (Last 6 Months)
          </h3>
          {data.monthlyComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No balance trend data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Monthly Income vs Expenses
        </h3>
        {data.monthlyComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            No comparison data available
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Recent Activity
          </h3>
          <Calendar className="w-5 h-5 text-gray-500" />
        </div>

        {/* Transaction counts for current month */}
        <div className="flex items-center space-x-4 mb-6">
          <Activity className="w-8 h-8 text-blue-500" />
          <div className="flex space-x-6 text-gray-800 dark:text-white font-medium text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-green-600 dark:text-green-400 font-semibold">Income:</span>
              <span>{data.currentMonthCounts.income}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-red-600 dark:text-red-400 font-semibold">Expenses:</span>
              <span>{data.currentMonthCounts.expense}</span>
            </div>
          </div>
        </div>

        {recentTransactionsList.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentTransactionsList.slice(0, 10).map((transaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-white/10 dark:bg-gray-800/10 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${transaction.type === 'income'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                      }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {transaction.note ||
                        (transaction.category
                          ? `${transaction.category}${transaction.subcategory ? ` - ${transaction.subcategory}` : ''
                          }`
                          : 'Transaction')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet this month</p>
            <p className="text-sm">Start by adding your first income or expense</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={handleTransactionSuccess}
      />
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};

export default Dashboard;