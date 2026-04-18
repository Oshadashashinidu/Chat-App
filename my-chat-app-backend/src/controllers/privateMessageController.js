const { pool } = require('../config/dbConfig');

const getConversations = async (req, res) => {
  try {
    const currentUserId = Number(req.userId);

    const result = await pool.query(
      `WITH ranked AS (
         SELECT
           pm.id,
           pm.sender_id,
           pm.receiver_id,
           pm.message_text,
           pm.created_at,
           CASE WHEN pm.sender_id = $1 THEN pm.receiver_id ELSE pm.sender_id END AS other_user_id,
           ROW_NUMBER() OVER (
             PARTITION BY CASE WHEN pm.sender_id = $1 THEN pm.receiver_id ELSE pm.sender_id END
             ORDER BY pm.created_at DESC
           ) AS row_num
         FROM private_messages pm
         WHERE pm.sender_id = $1 OR pm.receiver_id = $1
       )
       SELECT
         ranked.other_user_id AS id,
         users.name,
         users.email,
         ranked.message_text AS "lastMessage",
         ranked.created_at AS "lastMessageAt"
       FROM ranked
       JOIN users ON users.id = ranked.other_user_id
       WHERE ranked.row_num = 1
       ORDER BY ranked.created_at DESC`,
      [currentUserId]
    );

    return res.json({ conversations: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load conversations', details: error.message });
  }
};

const getThreadMessages = async (req, res) => {
  try {
    const currentUserId = Number(req.userId);
    const otherUserId = Number(req.params.otherUserId);

    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await pool.query(
      `SELECT
         pm.id,
         pm.sender_id AS "fromUserId",
         sender.name AS "fromUserName",
         pm.receiver_id AS "toUserId",
         pm.message_text AS text,
         pm.created_at AS timestamp
       FROM private_messages pm
       JOIN users sender ON sender.id = pm.sender_id
       WHERE (pm.sender_id = $1 AND pm.receiver_id = $2)
          OR (pm.sender_id = $2 AND pm.receiver_id = $1)
       ORDER BY pm.created_at ASC`,
      [currentUserId, otherUserId]
    );

    return res.json({ messages: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load private messages', details: error.message });
  }
};

module.exports = {
  getThreadMessages,
  getConversations
};
