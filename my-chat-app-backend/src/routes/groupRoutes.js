const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createGroup, getMyGroups, getGroupMessages } = require('../controllers/groupController');

const router = express.Router();

router.post('/', authMiddleware, createGroup);
router.get('/', authMiddleware, getMyGroups);
router.get('/:groupId/messages', authMiddleware, getGroupMessages);

module.exports = router;
