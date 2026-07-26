const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getEnv = (dbKey, postgresKey) => process.env[dbKey] || process.env[postgresKey];

const requiredDbEnvVars = [
  ['DB_HOST', 'POSTGRES_HOST'],
  ['DB_NAME', 'POSTGRES_DATABASE'],
  ['DB_USER', 'POSTGRES_USER'],
  ['DB_PASSWORD', 'POSTGRES_PASSWORD']
];
const missingDbEnvVars = requiredDbEnvVars.filter(([dbKey, postgresKey]) => !getEnv(dbKey, postgresKey));

if (missingDbEnvVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingDbEnvVars
      .map(([dbKey, postgresKey]) => `${dbKey} or ${postgresKey}`)
      .join(', ')}`
  );
}

const dbConfig = {
  host: getEnv('DB_HOST', 'POSTGRES_HOST'),
  port: Number(getEnv('DB_PORT', 'POSTGRES_PORT') || 5432),
  database: getEnv('DB_NAME', 'POSTGRES_DATABASE'),
  user: getEnv('DB_USER', 'POSTGRES_USER'),
  password: getEnv('DB_PASSWORD', 'POSTGRES_PASSWORD'),
  ssl: getEnv('DB_SSL', 'POSTGRES_SSL') === 'true'
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
