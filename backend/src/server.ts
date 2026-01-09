import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import pollRoutes from './routes/poll.routes';
import { errorHandler } from './middleware/errorHandler';
import PollSocketHandler from './handlers/PollSocketHandler';


dotenv.config();

const app: Application = express();
const httpServer = createServer(app);


const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/polls', pollRoutes);


app.use(errorHandler);


const pollSocketHandler = new PollSocketHandler(io);
io.on('connection', (socket) => {
  pollSocketHandler.handleConnection(socket);
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    await connectDatabase();


    httpServer.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log('Socket.io server is ready');
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down HTTP server');
  httpServer.close(() => {
    console.log('HTTP server has been closed');
  });
});
