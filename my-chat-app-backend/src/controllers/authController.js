const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/dbConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'chat-app-dev-secret';
const JWT_EXPIRES_IN = '1d';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = String(phone).trim();

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [
      normalizedEmail,
      normalizedPhone
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email or phone' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [name.trim(), normalizedEmail, normalizedPhone, passwordHash]
    );

    return res.status(201).json({
      message: 'Account created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await pool.query(
      'SELECT id, name, email, phone, password_hash FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, created_at FROM users WHERE id = $1', [
      req.userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
};

module.exports = {
  signup,
  login,
  getProfile
};
