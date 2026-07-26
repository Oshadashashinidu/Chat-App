# Realtime Chat App

A full-stack realtime chat application built with React, TypeScript, Node.js, Express, Socket.IO, and Supabase/PostgreSQL.

The app supports user authentication, private messaging, group chats, and a public realtime chat room.

## Features

- User signup and login
- JWT-based authentication
- Password hashing with bcrypt
- Private one-to-one chat
- Group chat with members
- Public realtime chat room
- Realtime messaging with Socket.IO
- PostgreSQL/Supabase database storage
- TypeScript React frontend

## Tech Stack

Frontend:

- React 18
- TypeScript
- Create React App
- Socket.IO Client
- CSS

Backend:

- Node.js
- Express.js
- Socket.IO
- PostgreSQL / Supabase
- JWT
- bcryptjs
- dotenv
- pg

## Project Structure

```txt
.
├── my-chat-app-backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── routes
│   │   ├── sockets
│   │   ├── app.js
│   │   └── server.js
│   ├── sql
│   ├── .env.example
│   └── package.json
│
└── my-chat-app-frontend
    ├── public
    ├── src
    │   ├── components
    │   ├── utils
    │   ├── App.tsx
    │   ├── index.tsx
    │   ├── socket.ts
    │   └── types.ts
    ├── tsconfig.json
    └── package.json
```

## Getting Started

Clone the repository:

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

## Database Setup

Create a Supabase project or PostgreSQL database.

Then run the SQL files from the backend `sql` folder in this order:

```txt
my-chat-app-backend/sql/supabase_users_table.sql
my-chat-app-backend/sql/supabase_private_messages_table.sql
my-chat-app-backend/sql/supabase_groups_tables.sql
```

These files create:

- `users`
- `private_messages`
- `chat_groups`
- `chat_group_members`
- `chat_group_messages`

## Backend Setup

Go to the backend folder:

```bash
cd my-chat-app-backend
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Add your database credentials to `.env`.

Example using Supabase pooler credentials:

```env
POSTGRES_HOST=your-pooler-host
POSTGRES_PORT=6543
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres.your-project-ref
POSTGRES_PASSWORD=your-database-password
POSTGRES_SSL=true
JWT_SECRET=your-long-random-jwt-secret
PORT=3000
```

You can also use this format:

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_SSL=true
JWT_SECRET=your-long-random-jwt-secret
PORT=3000
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```txt
http://localhost:3000
```

## Frontend Setup

Open a new terminal and go to the frontend folder:

```bash
cd my-chat-app-frontend
npm install
```

Optional: create a frontend `.env` file if your backend URL is different:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
```

Start the frontend:

```bash
npm start
```

If port `3000` is already used by the backend, React will ask to use another port. Type `Y`.

Common local URLs:

```txt
Backend:  http://localhost:3000
Frontend: http://localhost:3001
```

## API Endpoints

Auth:

```txt
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Users:

```txt
GET /api/users/search?q=name
```

Private messages:

```txt
GET /api/private-messages/conversations
GET /api/private-messages/thread/:otherUserId
```

Groups:

```txt
POST /api/groups
GET  /api/groups
GET  /api/groups/:groupId/messages
```

Messages:

```txt
GET  /api/messages
POST /api/messages
```

## Socket Events

Client sends:

```txt
chat:message
private:message
group:message
```

Client receives:

```txt
chat:history
chat:message
private:message
group:message
private:error
group:error
```

## Build Frontend

```bash
cd my-chat-app-frontend
npm run build
```

## Troubleshooting

If the backend shows:

```txt
password authentication failed for user
```

Check your `.env` database username and password. If using Supabase pooler credentials, the username usually looks like:

```txt
postgres.your-project-ref
```

If signup fails, check:

- Backend is running
- Database credentials are correct
- Required SQL tables are created
- Email or phone is not already registered
- Backend terminal logs for the real error

## Security Notes

- Never commit `.env`
- Keep `.env.example` only as a template
- Use a strong `JWT_SECRET`
- Rotate database passwords if they were shared publicly
- Do not expose private database credentials in frontend code

## License

This project is for learning and development purposes.
