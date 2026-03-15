import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all categories for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
            [req.user.id]
        );
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// ADD a new category
router.post('/', authenticateToken, async (req, res) => {
    const { name, type, icon, color, subcategories } = req.body;

    if (!name || !type) {
        return res.status(400).json({ success: false, message: 'Name and Type are required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO categories (user_id, name, type, icon, color, subcategories) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, name, type, icon || 'tag', color || '#000000', subcategories ? JSON.stringify(subcategories) : null]
        );
        res.json({
            success: true,
            category: { id: result.insertId, user_id: req.user.id, name, type, icon, color, subcategories }
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
});

// DELETE a category
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
});

export default router;
