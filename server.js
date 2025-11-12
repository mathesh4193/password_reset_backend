require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// CORS setup: allow both localhost and deployed clients
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://passwordresetg.netlify.app'];
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

app.options(/.*/, (req, res) => res.sendStatus(200));

app.get('/', (req, res) => res.send('Password Reset API is running '));
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error(' MONGO_URI not set in .env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  });
