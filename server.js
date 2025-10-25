require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// CORS setup
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman, mobile apps, curl
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send('API is running'));

// MongoDB connection
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI not set in env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
