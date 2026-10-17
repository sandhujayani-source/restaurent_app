const pool = require('./database');

async function testDatabase() {
    try {
        const connection = await pool.getConnection();

        console.log('✅ MySQL connection successful!');

        const [rows] = await connection.query(
            'SELECT DATABASE() AS databaseName'
        );

        console.log('📦 Connected database:', rows[0].databaseName);

        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await pool.end();
    }
}

testDatabase();