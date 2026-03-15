
import { db } from './config/database.js';

async function listUsers() {
    try {
        const [users] = await db.execute('SELECT id, username, email, role, status FROM users');
        console.log('--- Current Users in DB ---');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}

listUsers();
