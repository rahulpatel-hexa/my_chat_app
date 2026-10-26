# My Chat App

A full-stack real-time chat application built with React, Node.js, Express, and MongoDB.

## Tech Stack

**Frontend**
- React + Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- Socket.IO (for real-time communication)

## Project Structure

```text
my_chat_app/
├── backend/    # Node.js, Express, and MongoDB
├── frontend/   # React application
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/my_chat_app.git
cd my_chat_app
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and configure the required environment variables.

Example:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create a Cloudinary account and copy these values from its dashboard. Keep the API
secret only in `backend/.env`; never add real credentials to source control or
frontend environment variables. Profile photos are uploaded to Cloudinary through
the authenticated `PATCH /api/v1/users/me` endpoint.

Start the backend development server:

```bash
npm run dev
```

### 3. Setup the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory if required, and configure the frontend environment variables.

Start the frontend development server:

```bash
npm run dev
```

Open the local URL shown in your terminal.

## Features

- User authentication
- Email OTP verification
- Login and signup interface
- Real-time chat messages with Socket.IO
- Responsive user interface

*Features are being developed and may change as the project progresses.*

## Socket Authentication

Socket.IO connections must include the current access token in the handshake:

```ts
io("http://localhost:5000", {
  auth: { token: accessToken },
});
```

The backend rejects connections with a missing, invalid, or expired token. The
authenticated user ID is available on the server as `socket.data.userId`.

Join a conversation room after opening that conversation. The backend verifies
that the authenticated user is a participant before joining:

```ts
socket.emit("conversation:join", { conversationId }, (result) => {
  if (!result.success) console.error(result.error);
});

socket.on("message:new", (message) => {
  // Add the new message to the open conversation.
});
```

Messages created through `POST /api/v1/conversations/:id/messages` are saved
first, then broadcast to the conversation room as `message:new`.
When a conversation is opened or a new message arrives in the active chat, the
backend marks the other participant's messages as read and broadcasts
`message:read`. Contacts receive `presence:update` when a user comes online or
goes offline.
Typing indicators use `typing:start` and `typing:stop` events with a
`conversationId`; the backend broadcasts `typing:update` only to other sockets
in that conversation. Clients should join the conversation before sending typing
events. Typing state is cleared when the sender stops, leaves the conversation,
or disconnects.
The frontend uses `VITE_SOCKET_URL` when configured; otherwise it connects to
the origin from `VITE_API_URL` (default `http://localhost:5000`).

## Environment Variables

Never commit `.env` files, database credentials, email passwords, or secret