// models/ApiHistory.js
const mongoose = require('mongoose');

const apiHistorySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApiHistory', apiHistorySchema);
