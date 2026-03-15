import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, view } = req.query;

    // ANALYTICS VIEW LOGIC
    if (view) {
      const selectedYear = parseInt(year) || new Date().getFullYear();

      // 1. Monthly Comparison for selected year (Jan-Dec)
      const monthlyComparison = [];
      for (let i = 1; i <= 12; i++) {
        // Construct dates for the specific month
        const [income] = await db.execute(`
          SELECT COALESCE(SUM(amount), 0) as total FROM income 
          WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        `, [userId, i, selectedYear]);

        const [expense] = await db.execute(`
          SELECT COALESCE(SUM(amount), 0) as total FROM expense 
          WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        `, [userId, i, selectedYear]);

        const date = new Date(selectedYear, i - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });

        monthlyComparison.push({
          month: monthName,
          income: parseFloat(income[0].total),
          expense: parseFloat(expense[0].total)
        });
      }

      // 2. Category Expenses (for the ENTIRE selected year)
      // Join with categories table to get user-defined colors
      const [categoryExpenses] = await db.execute(`
        SELECT e.category, COALESCE(SUM(e.amount), 0) as total, c.color
        FROM expense e
        LEFT JOIN categories c ON e.category = c.name AND e.user_id = c.user_id
        WHERE e.user_id = ? AND YEAR(e.date) = ?
        GROUP BY e.category, c.color
        ORDER BY total DESC
      `, [userId, selectedYear]);

      // 3. Yearly Trends (Last 5 years)
      const yearlyTrends = [];
      const currentYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const y = currentYear - i;
        const [inc] = await db.execute(`
          SELECT COALESCE(SUM(amount), 0) as total FROM income 
          WHERE user_id = ? AND YEAR(date) = ?
        `, [userId, y]);

        const [exp] = await db.execute(`
          SELECT COALESCE(SUM(amount), 0) as total FROM expense 
          WHERE user_id = ? AND YEAR(date) = ?
        `, [userId, y]);

        yearlyTrends.push({
          year: y.toString(),
          income: parseFloat(inc[0].total),
          expense: parseFloat(exp[0].total)
        });
      }

      return res.json({
        success: true,
        data: {
          monthlyComparison,
          categoryExpenses: categoryExpenses.map(c => ({
            name: c.category,
            value: parseFloat(c.total),
            color: c.color || '#9CA3AF' // Default gray if no color found
          })),
          yearlyTrends
        }
      });
    }

    // DEFAULT DASHBOARD LOGIC
    const currentDate = new Date();
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();

    // Current month totals
    const [monthlyIncome] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM income 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
    `, [userId, currentMonth, currentYear]);

    const [monthlyExpense] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expense 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
    `, [userId, currentMonth, currentYear]);

    // Calculate previous months' balance (all transactions before current month)
    // Note: We need to handle year transition carefully
    const [previousBalance] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      ) combined
      WHERE date < ?
    `, [userId, userId, `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`]);

    // Calculate balances
    const currentMonthIncome = parseFloat(monthlyIncome[0].total);
    const currentMonthExpense = parseFloat(monthlyExpense[0].total);
    const currentMonthBalance = currentMonthIncome - currentMonthExpense;

    const previousTotalIncome = parseFloat(previousBalance[0].total_income);
    const previousTotalExpense = parseFloat(previousBalance[0].total_expense);
    const previousCumulativeBalance = previousTotalIncome - previousTotalExpense;

    const totalBalance = previousCumulativeBalance + currentMonthBalance;

    // Category-wise expenses (current month)
    const [categoryExpenses] = await db.execute(`
      SELECT e.category, COALESCE(SUM(e.amount), 0) as total, c.color
      FROM expense e
      LEFT JOIN categories c ON e.category = c.name AND e.user_id = c.user_id
      WHERE e.user_id = ? AND MONTH(e.date) = ? AND YEAR(e.date) = ?
      GROUP BY e.category, c.color
      ORDER BY total DESC
    `, [userId, currentMonth, currentYear]);

    // ALL Recent transactions (not filtered by month - let frontend handle filtering)
    const [recentTransactions] = await db.execute(`
      SELECT * FROM (
        SELECT 'income' as type, amount, note, date, NULL as category, NULL as subcategory, created_at
        FROM income WHERE user_id = ?
        UNION ALL
        SELECT 'expense' as type, amount, note, date, category, subcategory, created_at
        FROM expense WHERE user_id = ?
      ) combined
      ORDER BY date DESC, created_at DESC
      LIMIT 50
    `, [userId, userId]);

    // Current month transactions for counts
    const [currentMonthTransactionCounts] = await db.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
        SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count
      FROM (
        SELECT 'income' as type FROM income 
        WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        UNION ALL
        SELECT 'expense' as type FROM expense 
        WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      ) combined
    `, [userId, currentMonth, currentYear, userId, currentMonth, currentYear]);

    // Monthly comparison with running balance (last 6 months)
    const [monthlyComparison] = await db.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      ) combined
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `, [userId, userId]);

    // Calculate running balance for each month in comparison
    const monthlyComparisonWithBalance = [];
    let runningBalance = 0;

    // First, get balance before the 6-month period
    const [balanceBeforePeriod] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      ) combined
      WHERE date < DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `, [userId, userId]);

    runningBalance = parseFloat(balanceBeforePeriod[0].total_income) - parseFloat(balanceBeforePeriod[0].total_expense);

    // Calculate running balance for each month
    for (const month of monthlyComparison) {
      const monthIncome = parseFloat(month.income);
      const monthExpense = parseFloat(month.expense);
      runningBalance += (monthIncome - monthExpense);

      monthlyComparisonWithBalance.push({
        month: month.month,
        income: monthIncome,
        expense: monthExpense,
        balance: runningBalance
      });
    }

    res.json({
      success: true,
      data: {
        monthlyTotals: {
          income: currentMonthIncome,
          expense: currentMonthExpense,
          balance: totalBalance, // Total cumulative balance
          currentMonthBalance: currentMonthBalance, // This month's balance only
          previousBalance: previousCumulativeBalance // Previous months' balance
        },
        categoryExpenses: categoryExpenses.map(cat => ({
          name: cat.category,
          value: parseFloat(cat.total),
          color: cat.color || '#9CA3AF'
        })),
        recentTransactions: recentTransactions.map(transaction => ({
          ...transaction,
          amount: parseFloat(transaction.amount) // Ensure number
        })),
        currentMonthCounts: {
          income: parseInt(currentMonthTransactionCounts[0].income_count) || 0,
          expense: parseInt(currentMonthTransactionCounts[0].expense_count) || 0
        },
        monthlyComparison: monthlyComparisonWithBalance
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

export default router;