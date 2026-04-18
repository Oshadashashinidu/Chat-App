const { pool } = require('../config/dbConfig');

const createGroup = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUserId = Number(req.userId);
    const { name, memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const uniqueMembers = Array.from(
      new Set([
        currentUserId,
        ...memberIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      ])
    );

    if (uniqueMembers.length < 2) {
      return res.status(400).json({ error: 'Add at least one member to create a group' });
    }

    await client.query('BEGIN');

    const groupResult = await client.query(
      `INSERT INTO chat_groups (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_by AS "createdBy", created_at AS "createdAt"`,
      [name.trim(), currentUserId]
    );

    const group = groupResult.rows[0];

    for (const memberId of uniqueMembers) {
      await client.query(
        `INSERT INTO chat_group_members (group_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [group.id, memberId]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ group });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Failed to create group', details: error.message });
  } finally {
    client.release();
  }
};

const getMyGroups = async (req, res) => {
  try {
    const currentUserId = Number(req.userId);

    const result = await pool.query(
      `SELECT
         g.id,
         g.name,
         g.created_at AS "createdAt",
         (
           SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email) ORDER BY u.name)
           FROM chat_group_members gm
           JOIN users u ON u.id = gm.user_id
           WHERE gm.group_id = g.id
         ) AS members
       FROM chat_group_members mine
       JOIN chat_groups g ON g.id = mine.group_id
       WHERE mine.user_id = $1
       ORDER BY g.created_at DESC`,
      [currentUserId]
    );

    return res.json({ groups: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load groups', details: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const currentUserId = Number(req.userId);
    const groupId = Number(req.params.groupId);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const membership = await pool.query(
      'SELECT 1 FROM chat_group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1',
      [groupId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const result = await pool.query(
      `SELECT
         gm.id,
         gm.group_id AS "groupId",
         gm.sender_id AS "senderId",
         u.name AS "senderName",
         gm.message_text AS text,
         gm.created_at AS timestamp
       FROM chat_group_messages gm
       JOIN users u ON u.id = gm.sender_id
       WHERE gm.group_id = $1
       ORDER BY gm.created_at ASC`,
      [groupId]
    );

    return res.json({ messages: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load group messages', details: error.message });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroupMessages
};
