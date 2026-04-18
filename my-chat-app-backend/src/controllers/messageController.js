const Message = require('../models/message');

const messages = [];

const getMessages = (req, res) => {
  res.json(messages);
};

const postMessage = (req, res) => {
  const { user = 'Anonymous', text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const newMessage = Message.create({ user, text });
  messages.push(newMessage);

  return res.status(201).json(newMessage);
};

module.exports = {
  getMessages,
  postMessage,
  messages
};
