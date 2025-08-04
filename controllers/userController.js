const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');



exports.createUser = async (req, res) => {
  const { first_name,last_name,country,state,age,gender,phone,email,password,referred_by,contact_id,} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await userModel.createUser(first_name, last_name, country,state,age,gender,phone,email,hashedPassword,referred_by,contact_id);
    res.status(201).json(newUser);
  } catch (err) {
    if (
      err.message.includes('already exists') ||
      err.message.includes('Invalid referred_by')
    ) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
};


// Login user with JWT
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid password' });

    // Create JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        guide_code: user.guide_code,
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};