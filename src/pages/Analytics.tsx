import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';

interface AnalyticsData {
  monthlyComparison: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  categoryExpenses: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  yearlyTrends: Array<{
    year: string;
    income: number;
    expense: number;
  }>;
}



const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear, viewType]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
        const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/dashboard?year=${selectedYear}&view=${viewType}`,
        {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
      );

      if (response.data.success) {
        const dashboardData = response.data.data;

        const analyticsData: AnalyticsData = {
          monthlyComparison: (dashboardData.monthlyComparison || []).map((item: any) => ({
            ...item,
            balance: item.income - item.expense,
          })),
          categoryExpenses: dashboardData.categoryExpenses || [],
          yearlyTrends: dashboardData.yearlyTrends || [],
        };

        setData(analyticsData);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Financial Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your financial patterns
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/30 p-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'monthly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Monthly
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'yearly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Yearly
            </motion.button>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 dark:text-white appearance-none"
            >
              {years.map(year => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Income</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(data.monthlyComparison.reduce((sum, item) => sum + item.income, 0))}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(data.monthlyComparison.reduce((sum, item) => sum + item.expense, 0))}
              </p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Net Balance</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(data.monthlyComparison.reduce((sum, item) => sum + item.balance, 0))}
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Monthly</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(data.monthlyComparison.reduce((sum, item) => sum + item.expense, 0) / Math.max(data.monthlyComparison.length, 1))}
              </p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Income vs Expense Trend
          </h3>
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
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                strokeWidth={3}
                name="Expense"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Expense Categories
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No expense data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Balance Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Monthly Balance Overview
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.monthlyComparison}>
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
            <Area
              type="monotone"
              dataKey="income"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stackId="2"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.6}
              name="Expense"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Detailed Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Detailed Monthly Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.monthlyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Bar dataKey="balance" fill="#3B82F6" name="Balance" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default Analytics;