const { Schema } = require('mongoose');

// Internal comments — used on Quote, Contact (and later Reservation, etc.)
const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

module.exports = commentSchema;