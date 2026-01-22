import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send OTP Email using SendGrid Web API (HTTPS)
 */
export const sendOtpEmail = async (to, otp) => {
  try {
    await sgMail.send({
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "BookBridge",
      },
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
    console.error("SENDGRID API ERROR:", error.response?.body || error.message);
    throw new Error("Email service unavailable");
  }
};
