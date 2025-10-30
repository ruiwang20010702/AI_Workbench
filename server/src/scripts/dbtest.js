require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    const client = await pool.connect();
    console.log('✅ DB connect ok');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ DB connect failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
})();