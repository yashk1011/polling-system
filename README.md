# Live Polling System

Small real-time polling app with a separate view for teachers and students. I used React + TypeScript on the frontend and Node/Express + Socket.io + MongoDB on the backend.

## What you can do

- Teacher can create a multiple‑choice poll (2–4 options) with a timer
- Students see the question live and can answer once
- Results update in real time as people vote
- Basic history view of past polls

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Realtime: Socket.io
- Database: MongoDB (via Mongoose)

## Running the project locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# update MONGODB_URI in .env if needed
npm run dev
```

By default the API and Socket.io server run on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will start the frontend on `http://localhost:5173`.

### 3. Useful URLs

- Teacher dashboard: `http://localhost:5173/teacher`
- Student view: `http://localhost:5173/student`

## Env vars I used

Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/polling-system
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

That’s basically it – once both servers are running you can open the teacher and student URLs in different tabs/windows and try out the flow.
