const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model', 'system'], required: true },
  content: { type: String }, // For text messages
  toolCalls: { type: Array }, // For tool call messages
  toolResults: { type: Array }, // For tool result messages
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
