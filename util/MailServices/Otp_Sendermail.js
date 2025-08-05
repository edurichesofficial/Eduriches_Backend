const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ID, // Your Gmail ID
    pass: process.env.GMAIL_ID_PASSWORD, // Use App Password, not your actual password
  },
  tls: {
    rejectUnauthorized: false, // <=== bypasses cert check
  },
});

exports.sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: '"Eduriches OTP" <eduriches.official@gmail.com>',
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
};