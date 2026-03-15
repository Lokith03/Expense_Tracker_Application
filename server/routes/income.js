import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get all income records
router.get('/', authenticateToken, async (req, res) => {
  try {
    //const db = await connectDB();
    let { page = 1, limit = 10, year, month, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let baseCondition = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (year) {
      baseCondition += ' AND YEAR(date) = ?';
      params.push(year);
    }

    if (month) {
      baseCondition += ' AND MONTH(date) = ?';
      params.push(month);
    }

    if (search) {
      baseCondition += ' AND note LIKE ?';
      params.push(`%${search}%`);
    }

    const query = `
      SELECT * FROM income
      ${baseCondition}
      ORDER BY date DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM income
      ${baseCondition}
    `;

    const [records] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, params);

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
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income records'
    });
  }
});



// Add income
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, date, note } = req.body;

    if (!amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount and date are required'
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
      'INSERT INTO income (user_id, amount, date, note) VALUES (?, ?, ?, ?)',
      [req.user.id, amount, date, note || null]
    );

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data: {
        id: result.insertId,
        amount: parseFloat(amount),
        date,
        note
      }
    });

  } catch (error) {
    console.error('Add income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add income'
    });
  }
});

// Update income
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount and date are required'
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
      'UPDATE income SET amount = ?, date = ?, note = ? WHERE id = ? AND user_id = ?',
      [amount, date, note || null, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    res.json({
      success: true,
      message: 'Income updated successfully'
    });

  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update income'
    });
  }
});

// Delete income
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    //const db = await connectDB();

    const [result] = await db.execute(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });

  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income'
    });
  }
});

export default router;