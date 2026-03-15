import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

const EXPENSE_CATEGORIES = {
  'Food & Dining': ['Restaurant', 'Fast Food', 'Groceries', 'Cafe', 'Beverages'],
  'Transportation': ['Fuel', 'Public Transport', 'Taxi/Uber', 'Vehicle Maintenance', 'Parking'],
  'Housing': ['Rent', 'Utilities', 'Internet', 'Maintenance', 'Insurance'],
  'Healthcare': ['Doctor', 'Medicine', 'Dental', 'Hospital', 'Health Insurance'],
  'Entertainment': ['Movies', 'Games', 'Sports', 'Hobbies', 'Subscriptions'],
  'Shopping': ['Clothing', 'Electronics', 'Books', 'Gifts', 'Personal Care'],
  'Education': ['Courses', 'Books', 'Training', 'Certification', 'Online Learning'],
  'Investments': ['Mutual Funds', 'SIP', 'Stocks', 'Fixed Deposits', 'Crypto'],
  'Travel': ['Flight', 'Hotel', 'Local Transport', 'Food', 'Activities'],
  'Bills & Utilities': ['Electricity', 'Water', 'Gas', 'Phone', 'Internet'],
  'Personal': ['Haircut', 'Spa', 'Gym', 'Medical', 'Miscellaneous'],
  'Family': ['Kids', 'Parents', 'Spouse', 'Relatives', 'Pets'],
  'Others': ['Charity', 'Taxes', 'Loans', 'Miscellaneous'],
  'Uncategorized': []
};

// Get categories
router.get('/categories', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: EXPENSE_CATEGORIES
  });
});

// Get all expense records with pagination and filtering by year
router.get('/', authenticateToken, async (req, res) => {
  try {
    //const db = await connectDB();

    // Get filters and pagination
    const page = Number(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;

    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month); // optional
    const category = req.query.category;
    const search = req.query.search;

    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: 'Year is required and must be a valid number'
      });
    }

    // Build WHERE clauses dynamically
    const conditions = ['user_id = ?', 'YEAR(date) = ?'];
    const values = [req.user.id, year];

    if (!isNaN(month)) {
      conditions.push('MONTH(date) = ?');
      values.push(month);
    }

    if (category) {
      conditions.push('category = ?');
      values.push(category);
    }

    if (search) {
      conditions.push('note LIKE ?');
      values.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const [records] = await db.execute(
      `SELECT * FROM expense WHERE ${whereClause} ORDER BY date DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      values
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM expense WHERE ${whereClause}`,
      values
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          ...record,
          amount: parseFloat(record.amount)
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense records'
    });
  }
});



// Get total expense amount
router.get('/total', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    const category = req.query.category;

    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }

    const conditions = ['user_id = ?', 'YEAR(date) = ?'];
    const values = [req.user.id, year];

    if (!isNaN(month)) {
      conditions.push('MONTH(date) = ?');
      values.push(month);
    }

    if (category) {
      conditions.push('category = ?');
      values.push(category);
    }

    const whereClause = conditions.join(' AND ');

    const [result] = await db.execute(
      `SELECT SUM(amount) as total FROM expense WHERE ${whereClause}`,
      values
    );

    res.json({
      success: true,
      total: result[0].total || 0
    });

  } catch (error) {
    console.error('Get total expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total expenses'
    });
  }
});

// Add expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, category, subcategory, date, note } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount, category, and date are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    //const db = await connectDB();

    const [result] = await db.execute(
      'INSERT INTO expense (user_id, amount, category, subcategory, date, note) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, amount, category, subcategory || null, date, note || null]
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: {
        id: result.insertId,
        amount: parseFloat(amount),
        category,
        subcategory,
        date,
        note
      }
    });

  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense'
    });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, subcategory, date, note } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount, category, and date are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    //const db = await connectDB();

    const [result] = await db.execute(
      'UPDATE expense SET amount = ?, category = ?, subcategory = ?, date = ?, note = ? WHERE id = ? AND user_id = ?',
      [amount, category, subcategory || null, date, note || null, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully'
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    //const db = await connectDB();

    const [result] = await db.execute(
      'DELETE FROM expense WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
});

export default router;
