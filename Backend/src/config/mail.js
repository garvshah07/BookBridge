import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey", // ⚠️ MUST be literal "apikey"
    pass: process.env.SENDGRID_API_KEY,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
});

/**
 * Send OTP Email
 */
export const sendOtpEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"BookBridge" <${process.env.SENDGRID_FROM_EMAIL}>`,
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
    });
  } catch (error) {
    console.error("SENDGRID OTP EMAIL ERROR:", error.message);
    throw new Error("Email service unavailable");
  }
};
