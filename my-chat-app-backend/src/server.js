require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const socketEvents = require('./sockets/socketEvents');
const { testDbConnection } = require('./config/dbConfig');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

socketEvents(io);

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

testDbConnection()
  .then(() => {
    console.log('Connected to Supabase Postgres');
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
  });
