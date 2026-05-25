const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model', 'system'], required: true },
  content: { type: String }, // For text messages
  toolCalls: { type: Array, default: undefined }, // For tool call messages
  toolResults: { type: Array, default: undefined }, // For tool result messages
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
