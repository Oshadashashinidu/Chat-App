const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getThreadMessages, getConversations } = require('../controllers/privateMessageController');

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/thread/:otherUserId', authMiddleware, getThreadMessages);

module.exports = router;
