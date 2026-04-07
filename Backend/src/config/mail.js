// import dotenv from "dotenv";
// import sgMail from "@sendgrid/mail";

// dotenv.config();

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// /**
//  * Send OTP Email using SendGrid Web API (HTTPS)
//  */
// export const sendOtpEmail = async (to, otp) => {
//   try {
//     await sgMail.send({
//       to,
//       from: {
//         email: process.env.SENDGRID_FROM_EMAIL,
//         name: "BookBridge",
//       },
//       subject: "Your BookBridge Verification Code",
//       html: `
//         <div style="font-family: Arial, sans-serif;">
//           <h2>Email Verification</h2>
//           <p>Your OTP is:</p>
//           <h1 style="letter-spacing: 4px;">${otp}</h1>
//           <p>This OTP is valid for <b>5 minutes</b>.</p>
//           <p>If you did not request this, please ignore.</p>
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("SENDGRID API ERROR:", error.response?.body || error.message);
//     throw new Error("Email service unavailable");
//   }
// };




import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP Email using Gmail SMTP
 */
export const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"BookBridge App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your BookBridge login code",

      text: `Your OTP is ${otp}. Valid for 5 minutes.`,

      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>BookBridge</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.response);

  } catch (error) {
    console.error("GMAIL SMTP ERROR:", error.message);
    throw new Error("Email service unavailable");
  }
};