
import { db } from './config/database.js';

async function migrate() {
    try {
        console.log('Starting manual migration...');

        // Attempt to add role
        try {
            await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
            console.log('✅ Added role column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ role column already exists');
            } else {
                console.error('❌ Failed to add role:', e.message);
            }
        }

        // Attempt to add status
        try {
            await db.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending'");
            console.log('✅ Added status column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ status column already exists');
            } else {
                console.error('❌ Failed to add status:', e.message);
            }
        }

        // Attempt to add category to income
        try {
            await db.query("ALTER TABLE income ADD COLUMN category VARCHAR(100) DEFAULT 'Other'");
            console.log('✅ Added category to income');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ category column already exists in income');
            } else {
                console.error('❌ Failed to add category to income:', e.message);
            }
        }

        // Add phone column
        try {
            await db.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL");
            console.log('✅ Added phone column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ phone column already exists');
            } else {
                console.error('❌ Failed to add phone:', e.message);
            }
        }

        // Add currency column
        try {
            await db.query("ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'");
            console.log('✅ Added currency column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ currency column already exists');
            } else {
                console.error('❌ Failed to add currency:', e.message);
            }
        }

        // Add bio column
        try {
            await db.query("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL");
            console.log('✅ Added bio column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ bio column already exists');
            } else {
                console.error('❌ Failed to add bio:', e.message);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
