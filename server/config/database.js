import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ✅ Connection Pool (auto-reconnect, safe for long idle)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root@123",
  database: process.env.DB_NAME || "expense_tracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "+00:00"
});

// ✅ Check Connection on Startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Database connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

// ✅ Initialize DB + Tables (runs once)
export const initializeDatabase = async () => {
  try {
    // Create DB if not exists
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: "utf8mb4"
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await tempConn.end();

    await createTables();
    console.log("✅ Database and tables initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
  }
};

// ✅ Create Tables (idempotent)
const createTables = async () => {
  try {
    const db = pool;

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        user_image VARCHAR(255) DEFAULT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'pending', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ✅ Add columns if they don't exist (Migration logic)
    try {
      await db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`);
    } catch (e) {
      // Ignore if column exists
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending'`);
    } catch (e) {
      // Ignore if column exists
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column exists
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'`);
    } catch (e) {
      // Ignore if column exists
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL`);
    } catch (e) {
      // Ignore if column exists
    }

    // Add category functionality to income table
    try {
      await db.query(`ALTER TABLE income ADD COLUMN category VARCHAR(100) DEFAULT 'Other'`);
    } catch (e) {
      // Ignore if column exists
    }

    // Income table
    await db.query(`
      CREATE TABLE IF NOT EXISTS income (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, date),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Expense table
    await db.query(`
      CREATE TABLE IF NOT EXISTS expense (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100) DEFAULT NULL,
        date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, date),
        INDEX idx_category (category),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NOT NULL,
        name VARCHAR(100) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        icon VARCHAR(50) DEFAULT 'tag',
        color VARCHAR(20) DEFAULT '#000000',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_type (user_id, type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add subcategories column to categories table
    try {
      await db.query(`ALTER TABLE categories ADD COLUMN subcategories TEXT DEFAULT NULL`);
    } catch (e) {
      // Ignore if column exists
    }

    console.log("✅ All tables created successfully");
  } catch (err) {
    console.error("❌ Table creation error:", err.message);
  }
};

// ✅ Health Check Helper (for /health route)
export const checkDB = async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS time");
    console.log("📶 DB OK:", rows[0].time);
  } catch (err) {
    console.error("💥 DB check failed:", err.message);
  }
};

// Export pool
export const db = pool;
export default pool;
