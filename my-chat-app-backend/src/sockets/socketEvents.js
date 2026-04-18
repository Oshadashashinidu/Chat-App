const { messages } = require('../controllers/messageController');
const Message = require('../models/message');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/dbConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'chat-app-dev-secret';

const connectedUsers = new Map();

const addSocketForUser = (userId, socketId) => {
  const existingSockets = connectedUsers.get(userId) || new Set();
  existingSockets.add(socketId);
  connectedUsers.set(userId, existingSockets);
};

const removeSocketForUser = (userId, socketId) => {
  const existingSockets = connectedUsers.get(userId);
  if (!existingSockets) {
    return;
  }

  existingSockets.delete(socketId);

  if (existingSockets.size === 0) {
    connectedUsers.delete(userId);
  }
};

const emitToUser = (io, userId, eventName, payload) => {
  const sockets = connectedUsers.get(String(userId));
  if (!sockets) {
    return;
  }

  sockets.forEach((socketId) => {
    io.to(socketId).emit(eventName, payload);
  });
};

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Unauthorized socket connection'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = String(decoded.sub);
      socket.userName = decoded.name;

      return next();
    } catch (error) {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    addSocketForUser(socket.userId, socket.id);

    pool
      .query('SELECT group_id FROM chat_group_members WHERE user_id = $1', [Number(socket.userId)])
      .then((result) => {
        result.rows.forEach((row) => {
          socket.join(`group:${row.group_id}`);
        });
      })
      .catch(() => {});

    socket.emit('chat:history', messages);

    socket.on('chat:message', (payload) => {
      const normalized = Message.create({
        user: payload?.user || socket.userName || 'Anonymous',
        text: payload?.text || ''
      });

      if (!normalized.text) {
        return;
      }

      messages.push(normalized);
      io.emit('chat:message', normalized);
    });

    socket.on('private:message', async (payload) => {
      const targetUserId = String(payload?.targetUserId || '');
      const text = (payload?.text || '').trim();

      if (!targetUserId || !text) {
        return;
      }

      try {
        const saved = await pool.query(
          `INSERT INTO private_messages (sender_id, receiver_id, message_text)
           VALUES ($1, $2, $3)
           RETURNING id, sender_id, receiver_id, message_text, created_at`,
          [Number(socket.userId), Number(targetUserId), text]
        );

        const row = saved.rows[0];

        const privateMessage = {
          id: row.id,
          text: row.message_text,
          fromUserId: String(row.sender_id),
          fromUserName: socket.userName || payload?.fromUserName || 'Anonymous',
          toUserId: String(row.receiver_id),
          toUserName: payload?.toUserName || '',
          timestamp: row.created_at
        };

        emitToUser(io, targetUserId, 'private:message', privateMessage);
        emitToUser(io, socket.userId, 'private:message', privateMessage);
      } catch (error) {
        socket.emit('private:error', { message: 'Failed to send private message' });
      }
    });

    socket.on('group:message', async (payload) => {
      const groupId = Number(payload?.groupId);
      const text = String(payload?.text || '').trim();

      if (!Number.isInteger(groupId) || groupId <= 0 || !text) {
        return;
      }

      try {
        const membership = await pool.query(
          'SELECT 1 FROM chat_group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1',
          [groupId, Number(socket.userId)]
        );

        if (membership.rows.length === 0) {
          socket.emit('group:error', { message: 'You are not a member of this group' });
          return;
        }

        const saved = await pool.query(
          `INSERT INTO chat_group_messages (group_id, sender_id, message_text)
           VALUES ($1, $2, $3)
           RETURNING id, group_id, sender_id, message_text, created_at`,
          [groupId, Number(socket.userId), text]
        );

        const row = saved.rows[0];
        const messagePayload = {
          id: row.id,
          groupId: row.group_id,
          senderId: row.sender_id,
          senderName: socket.userName,
          text: row.message_text,
          timestamp: row.created_at
        };

        const members = await pool.query('SELECT user_id FROM chat_group_members WHERE group_id = $1', [groupId]);

        members.rows.forEach((member) => {
          emitToUser(io, String(member.user_id), 'group:message', messagePayload);
        });
      } catch (error) {
        socket.emit('group:error', { message: 'Failed to send group message' });
      }
    });

    socket.on('disconnect', () => {
      removeSocketForUser(socket.userId, socket.id);
    });
  });
};
