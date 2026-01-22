import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

/**
 * Send OTP Email
 */
export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"BookBridge" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your BookBridge Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
        <p>If you did not request this, please ignore.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
