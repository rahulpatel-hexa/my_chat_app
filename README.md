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
- Real-time messaging (planned or in development)
- Responsive user interface

*Features are being developed and may change as the project progresses.*

## Environment Variables

Never commit `.env` files, database credentials, email passwords, or secret