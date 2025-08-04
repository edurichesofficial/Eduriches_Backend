const express = require('express');
const app = express();
const pool = require('./config/db');
require('dotenv').config();

const { createUsersTable } = require('./config/Tables/CreateUserTable');

// Middleware
app.use(express.json());

// Routes
app.use('/api/v_1/users', require('./routes/userRoutes'));


app.get('/', (req, res) => {
  res.send('API is running...');
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database at:', result.rows[0].now);
    createUsersTable();
  }
});

module.exports = app;
