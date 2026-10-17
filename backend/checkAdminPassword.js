require('dotenv').config();

const db = require('./src/config/database');
const bcrypt = require('bcrypt');
const readline = require('readline');

async function resetAdminPassword() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const password = await new Promise(resolve => {
            rl.question('Enter your new admin password: ', resolve);
        });

        if (password.length < 8) {
            console.log('Password must contain at least 8 characters.');
            return;
        }

        const confirmPassword = await new Promise(resolve => {
            rl.question('Confirm your new admin password: ', resolve);
        });

        if (password !== confirmPassword) {
            console.log('Passwords do not match. Please try again.');
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            'UPDATE users SET password_hash = ? WHERE username = ?',
            [passwordHash, 'admin']
        );

        if (result.affectedRows === 1) {
            console.log('Admin password reset successfully!');
            console.log('You can now log in using your new password.');
        } else {
            console.log('Admin account not found. Password was not changed.');
        }
    } catch (error) {
        console.error('Password reset failed:', error.message);
    } finally {
        rl.close();
        await db.end();
    }
}

resetAdminPassword();