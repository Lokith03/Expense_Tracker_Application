import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware to check for Admin Role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }
};

// GET all users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, user_image, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// UPDATE user status
router.put('/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// UPDATE user details
router.put('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    try {
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 12);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);

        await db.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ success: true, message: 'User updated successfully' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// DELETE user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Prevent deleting self (super admin protection) if needed, 
        // but frontend usually handles logic. 
        // Let's add a check anyway.
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
        }

        // Manually delete related data to handle cases where CASCADE might be missing
        await db.execute('DELETE FROM income WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM expense WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM categories WHERE user_id = ?', [id]);

        // Finally delete the user
        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

export default router;
