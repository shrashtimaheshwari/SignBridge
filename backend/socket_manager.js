/**
 * socket_manager.js — All Socket.io events for SignBridge
 */
const rooms = {};

function getOtherUser(roomId, currentId) {
  if (rooms[roomId]) {
    for (const sid of rooms[roomId]) {
      if (sid !== currentId) return sid;
    }
  }
  return null;
}

function registerSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('process_frame', async (data) => {
      try {
        const response = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: data }),
        });
        if (!response.ok) throw new Error(`ML service returned ${response.status}`);
        const result = await response.json();
        socket.emit('prediction_result', {
          letter: result.letter,
          confidence: result.confidence,
          hand_detected: result.hand_detected,
          pinky_tip: result.pinky_tip,
          index_tip: result.index_tip,
        });
      } catch (err) {
        console.error('Prediction error:', err.message);
        socket.emit('prediction_error', { message: err.message });
      }
    });

    socket.on('join_room', (data) => {
      const roomId = data.room_id;
      if (!roomId) return;
      if (!rooms[roomId]) {
        rooms[roomId] = [socket.id];
        socket.emit('room_joined', { role: 'caller', room_id: roomId });
        console.log(`Room ${roomId} created by ${socket.id}`);
      } else if (rooms[roomId].length === 1) {
        rooms[roomId].push(socket.id);
        socket.emit('room_joined', { role: 'callee', room_id: roomId });
        io.to(rooms[roomId][0]).emit('user_joined', { room_id: roomId });
        console.log(`Room ${roomId} has 2 users. Connection initializing.`);
      } else {
        socket.emit('room_full', { room_id: roomId });
      }
    });

    socket.on('webrtc_offer', (data) => {
      const other = getOtherUser(data.room_id, socket.id);
      if (other) io.to(other).emit('webrtc_offer', { offer: data.offer });
    });

    socket.on('webrtc_answer', (data) => {
      const other = getOtherUser(data.room_id, socket.id);
      if (other) io.to(other).emit('webrtc_answer', { answer: data.answer });
    });

    socket.on('ice_candidate', (data) => {
      const other = getOtherUser(data.room_id, socket.id);
      if (other) io.to(other).emit('ice_candidate', { candidate: data.candidate });
    });

    socket.on('send_subtitle', (data) => {
      const other = getOtherUser(data.room_id, socket.id);
      if (other) io.to(other).emit('receive_subtitle', { text: data.text });
    });

    socket.on('leave_room', (data) => {
      const roomId = data.room_id;
      if (rooms[roomId]) {
        const idx = rooms[roomId].indexOf(socket.id);
        if (idx !== -1) {
          rooms[roomId].splice(idx, 1);
          for (const s of rooms[roomId]) io.to(s).emit('user_left', { sid: socket.id });
          if (rooms[roomId].length === 0) delete rooms[roomId];
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      for (const [roomId, users] of Object.entries(rooms)) {
        const idx = users.indexOf(socket.id);
        if (idx !== -1) {
          users.splice(idx, 1);
          for (const s of users) io.to(s).emit('user_left', { sid: socket.id });
          if (users.length === 0) delete rooms[roomId];
        }
      }
    });
  });
}

module.exports = { registerSocketEvents };
