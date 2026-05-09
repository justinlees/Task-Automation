require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const chatRoutes = require('./routes/chat');
const notesRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/notes', notesRoutes);

app.get('/', (req, res) => {
  res.send('AI Agent API is running.');
});

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
