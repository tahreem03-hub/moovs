const { Schema } = require('mongoose');

// Shared address shape — embedded by Contact (home/work) and Quote (stops)
const addressSchema = new Schema(
  {
    formatted: { type: String, trim: true }, // full display string
    placeId: String,                          // Google Places ID
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false }
);

module.exports = addressSchema;