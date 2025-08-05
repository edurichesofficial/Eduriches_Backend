const pool = require('../config/db');

exports.createUser = async (first_name, last_name, country, state, age, gender, phone, email, password, referred_by, contact_id) => {
  const guide_code = (first_name.slice(0, 2) + last_name.slice(0, 2) + phone.slice(-4)).toUpperCase();

  const checkExisting = await pool.query( `SELECT id FROM users WHERE email = $1 OR phone = $2 OR contact_id = $3`,[email, phone, contact_id]);

  if (checkExisting.rowCount > 0) {
    throw new Error('User with this email, phone, or contact ID already exists');
  }

  // 2. Check if guide_code is already used
  const checkGuideCode = await pool.query( `SELECT id FROM users WHERE guide_code = $1`,[guide_code] );

  if (checkGuideCode.rowCount > 0) {
    throw new Error('Guide code already exists');
  }

  // 3. Check if referred_by guide_code exists (if provided)
  if (referred_by) {
    const refCheck = await pool.query( `SELECT id FROM users WHERE guide_code = $1`,[referred_by]);

    if (refCheck.rowCount === 0) {
      throw new Error('Invalid referred_by guide code');
    }
  }

  // 4. Insert user
  const result = await pool.query( `INSERT INTO users (first_name, last_name, country, state, age, gender, phone, email, password, referred_by, guide_code, contact_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)RETURNING *`,
    [first_name, last_name, country, state, age, gender, phone, email, password, referred_by, guide_code, contact_id]
  );

  return result.rows[0];
};


exports.generateotp = async (email, otp) => {
  try {
    const checkExisting = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);

    if (checkExisting.rowCount === 0) {
      return "User not found"; 
    }

    await pool.query(`DELETE FROM otp_verification WHERE user_email = $1`, [email]);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const result = await pool.query(`INSERT INTO otp_verification (user_email, otp_code, expires_at) VALUES ($1, $2, $3) RETURNING *`, [email, otp, expiresAt]);
    if (result.rowCount === 0) {
      return "Failed to generate OTP";
    }

    return result.rows[0];

  } catch (error) {
    return null;
  }
};
