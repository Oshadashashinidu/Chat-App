const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { searchUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/search', authMiddleware, searchUsers);

module.exports = router;
