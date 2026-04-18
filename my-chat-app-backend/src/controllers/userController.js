const { pool } = require('../config/dbConfig');

const searchUsers = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();

    const result = query
      ? await pool.query(
          `SELECT id, name, email
           FROM users
           WHERE id <> $1
             AND name ILIKE $2
           ORDER BY name ASC
           LIMIT 20`,
          [req.userId, `%${query}%`]
        )
      : await pool.query(
          `SELECT id, name, email
           FROM users
           WHERE id <> $1
           ORDER BY name ASC
           LIMIT 20`,
          [req.userId]
        );

    return res.json({ users: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search users', details: error.message });
  }
};

module.exports = {
  searchUsers
};
