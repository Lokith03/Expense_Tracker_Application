import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import incomeRoutes from './routes/income.js';
import expenseRoutes from './routes/expense.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import categoryRoutes from './routes/category.js';
import { initializeDatabase, db } from './config/database.js';   // ✅ use pool-based file

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').concat(['https://novatrax.novacodex.in']);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// ✅ Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static uploads folder
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes); // ✅ Admin Routes
app.use('/api/pcategories', categoryRoutes); // ✅ Category Routes ("personal categories")
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ Health-check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS time');
    res.json({ status: 'ok', db_time: rows[0].time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ✅ Server start
const startServer = async () => {
  try {
    await initializeDatabase();  // pool handles reconnects automatically
    console.log('✅ Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Expense Tracker Pro - Backend Ready`);
      console.log(`🔗 Developer: https://thamaraiselvan.novacodex.in/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
