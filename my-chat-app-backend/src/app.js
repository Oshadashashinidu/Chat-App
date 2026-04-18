const express = require('express');
const cors = require('cors');
const path = require('path');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const privateMessageRoutes = require('./routes/privateMessageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/private-messages', privateMessageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);

module.exports = app;
