const { Pool } = require('pg');

const defaultDbConfig = {
  host: 'db.zyjiifacqovufuavaoef.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'g9MHrPqj61MfGygp',
  ssl: true,
  overrideEnv: true
};

const dbConfig = defaultDbConfig.overrideEnv
  ? defaultDbConfig
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true'
    };

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false
});

const testDbConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  dbConfig,
  testDbConnection
};
