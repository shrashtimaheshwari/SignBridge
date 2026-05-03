const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    hashed_password: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    google_id: {
      type: String,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Use existing "users" collection — do NOT let Mongoose pluralize
    collection: 'users',
    // Disable Mongoose's default __v versioning field
    versionKey: false,
  }
);

module.exports = mongoose.model('User', userSchema);
