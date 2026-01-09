# Live Polling System

A resilient real-time polling system built with React, Node.js, Socket.io, and MongoDB. Features teacher and student personas with state recovery, timer synchronization, and race condition prevention.

## Features

### Teacher Persona
- Create polls with 2-4 options and configurable timer (10-300 seconds)
- View live results with real-time updates
- View poll history with aggregate results from database
- Prevent creating new polls if one is already active
- Manually end polls

### Student Persona
- Enter name on first visit (unique per browser tab)
- Receive questions instantly when teacher starts a poll
- Synchronized countdown timer (adjusts for late joiners)
- Submit answers within time limit
- View live results after voting
- Prevent duplicate voting

### System Resilience
- **State Recovery**: Refresh during active poll restores current state
- **Timer Synchronization**: Late joiners get accurate remaining time
- **Race Condition Prevention**: Database-level duplicate vote protection
- **Graceful Error Handling**: Connection errors handled with user feedback

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **Database**: MongoDB with Mongoose
- **Styling**: Custom CSS with gradient designs

## Architecture

### Backend (Controller-Service Pattern)
```
backend/
├── src/
│   ├── models/         # Mongoose schemas (Poll, Vote)
│   ├── services/       # Business logic (PollService)
│   ├── controllers/    # HTTP request handlers
│   ├── handlers/       # Socket.io event handlers
│   ├── middleware/     # Error handling
│   ├── routes/         # Express routes
│   └── server.ts       # Entry point
```

### Frontend (Custom Hooks Pattern)
```
frontend/
├── src/
│   ├── components/
│   │   ├── teacher/    # Teacher dashboard components
│   │   └── student/    # Student view components
│   ├── hooks/          # Custom hooks (useSocket, usePollTimer, usePollState)
│   ├── services/       # API client (axios)
│   └── types/          # TypeScript interfaces
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository
```bash
cd assignemnt_intervue
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI

# Start MongoDB (if local)
# mongod

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

- **Teacher Dashboard**: http://localhost:5173/teacher
- **Student View**: http://localhost:5173/student

## HOW_TO_RUN (For Assignment Submission)

1. **Backend**
   - Directory: `backend`
   - Install: `npm install`
   - Env file (`backend/.env`):
     - `PORT=5000`
     - `MONGODB_URI=<your MongoDB connection string>`
     - `CORS_ORIGIN=http://localhost:5173`
     - `NODE_ENV=development`
   - Run (dev): `npm run dev`

2. **Frontend**
   - Directory: `frontend`
   - Install: `npm install`
   - Env file (`frontend/.env`):
     - `VITE_API_URL=http://localhost:5000/api`
     - `VITE_SOCKET_URL=http://localhost:5000`
   - Run (dev): `npm run dev`

3. **Open in browser**
   - Teacher: `http://localhost:5173/teacher`
   - Student: `http://localhost:5173/student`

4. **Test key behaviors**
   - Create a poll as Teacher and verify Students receive it in real time.
   - Refresh Teacher/Student during an active poll and ensure state is restored.
   - Join a poll late and confirm timer shows remaining time (not full duration).
   - Vote once as a Student and confirm duplicate votes are rejected.

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/polling-system
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Testing the System

### Test State Recovery
1. Teacher creates a poll
2. Students join and see the poll
3. Refresh teacher or student page
4. Verify the poll state is restored correctly

### Test Timer Synchronization
1. Teacher starts a 60-second poll
2. Wait 10 seconds
3. New student joins
4. Verify student timer shows 50 seconds (not 60)

### Test Race Condition Prevention
1. Student submits a vote
2. Try to vote again (inspect network or modify client)
3. Verify second vote is rejected with error

### Test Real-time Updates
1. Open teacher dashboard in one browser
2. Open multiple student tabs
3. Students vote and watch teacher dashboard update in real-time

## API Endpoints

### REST API
- `POST /api/polls` - Create new poll
- `GET /api/polls/active` - Get active poll
- `GET /api/polls/history` - Get poll history
- `GET /api/polls/:id/results` - Get poll results
- `POST /api/polls/:id/end` - End poll

### Socket Events
**Client → Server:**
- `create-poll` - Teacher creates poll
- `submit-vote` - Student submits vote
- `join-poll` - Student joins session
- `end-poll` - Teacher ends poll

**Server → Client:**
- `poll-started` - Poll started broadcast
- `poll-update` - Results updated
- `poll-ended` - Poll ended
- `vote-recorded` - Vote confirmed
- `error` - Error message

## Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Deploy from GitHub
3. Update CORS_ORIGIN to frontend URL

### Frontend (Vercel/Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add environment variables for API and Socket URLs

### Database (MongoDB Atlas)
1. Create cluster
2. Get connection string
3. Update MONGODB_URI in backend

## Known Issues & Solutions

- **CORS Errors**: Ensure CORS_ORIGIN matches frontend URL
- **Socket Connection Failed**: Check firewall and Socket URL
- **Database Connection**: Verify MongoDB is running and URI is correct

## Future Enhancements

- Teacher authentication
- Multiple concurrent poll sessions
- Poll analytics and export
- Mobile app support
- WebRTC for video integration

## License

MIT

## Author

Built for Intervue.io SDE Intern Assignment
