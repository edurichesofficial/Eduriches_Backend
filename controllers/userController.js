const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const otpSender = require('../util/MailServices/Otp_Sendermail');


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
    const token = jwt.sign( { userId: user.id, email: user.email },process.env.JWT_SECRET,{ expiresIn: '30d' });

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
    res.status(500).json({ error: 'Server error' });
  }
};


exports.otpGeneration = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpResult = await userModel.generateotp(email, otp);

    if( !otpResult || otpResult === "User not found") {
      return res.status(404).json({ error: 'User not found' });
    }

    if (otpResult === "Failed to generate OTP") {
      return res.status(500).json({ error: 'Failed to generate OTP' }); 
    }

    // TODO: Send OTP via email or SMS here using any service (e.g., nodemailer, Twilio)
    sendOtpEmail = await otpSender.sendOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const result = await pool.query(`SELECT * FROM otp_verification WHERE user_email = $1 AND otp_code = $2 AND expires_at > NOW()`, [email, otp]);

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    // await pool.query(`DELETE FROM otp_verification WHERE user_email = $1`, [email]);

    res.status(200).json({ message: 'OTP verified successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}


exports.resetPassword = async (req, res) => {
  const { email, newPassword,otp } = req.body;

  if (!email || !newPassword || !otp) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const result = await pool.query(`SELECT * FROM otp_verification WHERE user_email = $1 AND otp_code = $2 AND expires_at > NOW()`, [email, otp]);
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const response = await pool.query(`UPDATE users SET password = $1 WHERE email = $2 RETURNING *`, [hashedPassword, email]);

    if (response.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(`DELETE FROM otp_verification WHERE user_email = $1`, [email]);

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};