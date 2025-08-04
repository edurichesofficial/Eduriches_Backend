const pool = require('../db');

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      state TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      guide_code TEXT UNIQUE,
      referred_by TEXT,
      is_email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_of_birth DATE,
      customer_image TEXT,
      contact_id TEXT UNIQUE
    );
  `;

  try {
    await pool.query(query);
    console.log('✅ Users table created or already exists.');
  } catch (err) {
    console.error('❌ Error creating users table:', err);
  }
};

module.exports = { createUsersTable };
