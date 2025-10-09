require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(cors());

// API routes
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send('API is running...'));

// Connect to Mongo and start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}).catch(err => {
  console.error('DB connection error:', err);
});
