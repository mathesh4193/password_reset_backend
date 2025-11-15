require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// SIMPLE FULLY SAFE CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ROUTES
app.get("/", (req, res) => {
  res.send("Password Reset API is running...");
});

app.use("/api/auth", authRoutes);

// MONGODB CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((err) => console.error("Mongo Error:", err));
