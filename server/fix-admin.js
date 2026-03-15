
import { db } from './config/database.js';

async function fixAdmin() {
    try {
        const email = 'athamaraiselvan694@gmail.com';
        console.log(`Promoting ${email} to Admin and Approved status...`);

        const [result] = await db.execute(
            "UPDATE users SET role = 'admin', status = 'approved' WHERE email = ?",
            [email]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Super Admin updated successfully.');
        } else {
            console.log('⚠️ User not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
}

fixAdmin();
