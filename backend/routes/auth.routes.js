const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { createToken } = require('../utils/jwt.utils');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── POST /auth/register ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({ detail: 'Name must be at least 2 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already exists' });
    }

    const hashed_password = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      hashed_password,
      created_at: new Date(),
    });

    const access_token = createToken({ sub: user.email });

    return res.json({
      access_token,
      token_type: 'bearer',
      user: { name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// ─── POST /auth/login ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const access_token = createToken({ sub: user.email });

    return res.json({
      access_token,
      token_type: 'bearer',
      user: { name: user.name, email: user.email, avatar: user.avatar || '' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.sub });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    return res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// ─── POST /auth/reset-password ────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Check if new password is same as old
    if (user.hashed_password) {
      const isSame = await bcrypt.compare(new_password, user.hashed_password);
      if (isSame) {
        return res.status(400).json({ detail: 'New password cannot be the same as old password' });
      }
    }

    const hashed_password = await bcrypt.hash(new_password, 12);
    await User.updateOne({ email }, { $set: { hashed_password } });

    return res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// ─── POST /auth/google ───────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const google_id = payload.sub;
    const email = payload.email;
    const name = payload.name || 'Google User';
    const avatar = payload.picture || '';

    let user = await User.findOne({ email });

    if (user) {
      // Link Google account if not already linked
      if (!user.google_id) {
        await User.updateOne({ email }, { $set: { google_id, avatar } });
        user.google_id = google_id;
        user.avatar = avatar;
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        hashed_password: null,
        avatar,
        google_id,
        created_at: new Date(),
      });
    }

    const access_token = createToken({ sub: user.email, id: user._id.toString() });

    return res.json({
      access_token,
      token_type: 'bearer',
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        google_id: user.google_id,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    if (err.message && err.message.includes('Token')) {
      return res.status(401).json({ detail: 'Invalid Google token' });
    }
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
