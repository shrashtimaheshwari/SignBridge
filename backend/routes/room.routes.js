const express = require('express');

const router = express.Router();

/**
 * Generates a room code in the format: abc-1a2b-xyz
 * Matches the Python backend's format exactly.
 */
function generateRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const alphanum = chars + '0123456789';

  const part1 = Array.from({ length: 3 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  const part2 = Array.from({ length: 4 }, () =>
    alphanum[Math.floor(Math.random() * alphanum.length)]
  ).join('');

  const part3 = Array.from({ length: 3 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  return `${part1}-${part2}-${part3}`;
}

// ─── GET /room/create ─────────────────────────────────
router.get('/create', (req, res) => {
  const room_code = generateRoomCode();
  return res.json({ room_code });
});

module.exports = router;
