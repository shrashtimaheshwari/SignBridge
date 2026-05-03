require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { registerSocketEvents } = require('./socket_manager');

const authRouter = require('./routes/auth.routes');
const roomRouter = require('./routes/room.routes');

const PORT = process.env.PORT || 3000;

// 1. Create Express app + HTTP server
const app = express();
const httpServer = http.createServer(app);

// 2. Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// 3. Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// 4. Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URL, { dbName: 'signbridge' })
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// 5. Mount routes
app.use('/auth', authRouter);
app.use('/room', roomRouter);

// 6. Health endpoint
app.get('/health', async (req, res) => {
  try {
    const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/health`);
    const mlData = await mlRes.json();
    return res.json({ status: 'ok', model_loaded: mlData.model_loaded });
  } catch {
    return res.json({ status: 'ok', model_loaded: false });
  }
});

// 7. Register Socket.io events
registerSocketEvents(io);

// 8. Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});
