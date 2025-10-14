require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// ✅ Proper CORS setup for local + deployed frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://passwordresetg.netlify.app'
  ],
  credentials: true
}));

// API routes
app.use('/api/auth', authRoutes);

// Default route
app.get('/', (req, res) => res.send('API is running...'));

// MongoDB connection
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
