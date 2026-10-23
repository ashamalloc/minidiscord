# Mingle — Mini Discord

A full-stack, Discord-inspired text communication platform built with React, Vite, Express, MongoDB, JWT, and Socket.IO.

## MVP features
- Sign up and log in with JWT authentication and hashed passwords
- Create spaces (servers) and join via invite code
- Create text channels (space owner only in this MVP)
- Persistent message history and real-time message delivery
- Typing indicators and channel membership checks
- Responsive desktop and mobile layout

## Requirements
- Node.js 20+ recommended
- MongoDB local instance or MongoDB Atlas database

## 1. Configure environment files

Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a long random `JWT_SECRET`.
Copy `client/.env.example` to `client/.env` if you need a different API URL.

Example local server config:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/minidiscord
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Never commit `.env` files or real secrets.

## 2. Install dependencies

In one terminal:

```bash
cd server
npm install
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL printed in the client terminal, normally `http://localhost:5173`.

## 3. Try the app with multiple users

1. Create an account and a space.
2. Copy the invite code from the channel sidebar.
3. Open the app in a private/incognito window or another browser and create a second account.
4. Use **Join a space** and enter the invite code.
5. Send messages from both sessions in the same channel. Messages should appear in real time.

## API overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT)
- `GET /api/servers` (JWT)
- `POST /api/servers` (JWT)
- `POST /api/servers/join` (JWT)
- `GET /api/servers/:serverId/channels` (JWT)
- `POST /api/servers/:serverId/channels` (JWT; owner only)
- `GET /api/servers/channels/:channelId/messages` (JWT; last 100 messages)
- `GET /api/health`

Socket.IO events: `channel:join`, `message:send`, `message:new`, `typing:set`, `typing:update`. Socket connections authenticate using the JWT token; server-side membership checks are performed before joining a channel or sending a message.

## Current MVP limits
- Text messages only; no attachments, voice/video, message editing, moderation, or password reset.
- Only the server owner can create channels.
- Invite codes are shareable bearer codes; anyone who has one can join. Add invite rotation and role/permission controls before using this for sensitive communities.
- JWTs are stored in localStorage for this learning project. For a production deployment, evaluate secure, httpOnly cookies, rate limiting, stronger operational controls, and an HTTPS deployment.
