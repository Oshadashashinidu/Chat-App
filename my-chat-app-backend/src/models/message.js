class Message {
  static create({ user, text }) {
    return {
      id: Date.now(),
      user,
      text,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Message;
