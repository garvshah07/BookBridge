import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../src/config/db.js";
import { sendOtpEmail } from "../config/mail.js";
import { generateOtp } from "../utils/otp.js";

const JWT_SECRET = process.env.JWT_SECRET;

/* ===================== CREATE USER ===================== */

export const createUser = async (userData) => {
  try {
    const { firstname, lastname, email, password, role = "User" } = userData;

    // Check existing user (fast because of index)
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash directly (no separate salt step)
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, firstname, lastname, email, role`,
      [firstname, lastname, email, hashedPassword, role],
    );

    return result.rows[0];
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
};

/* ===================== LOGIN USER ===================== */

export const loginUser = async (userData) => {
  try {
    const { email, password } = userData;

    const result = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || "user",
      },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

    return { token };
  } catch (error) {
    throw new Error("Error logging in: " + error.message);
  }
};

/* ===================== Forgot PASSWORD ===================== */

// export const forgotPassword = async ({ email }) => {
//   if (!email) throw new Error("Email is required");

//   const user = await pool.query("SELECT id FROM users WHERE email = $1", [
//     email,
//   ]);

//   if (user.rows.length === 0) {
//     throw new Error("Email not registered");
//   }

//   const otp = generateOtp();
//   const expires = new Date(Date.now() + 5 * 60 * 1000);

//   await pool.query(
//     `UPDATE users
//      SET reset_otp = $1, reset_otp_expires = $2
//      WHERE email = $3`,
//     [otp, expires, email],
//   );

//   await sendOtpEmail(email, otp);

//   return { message: "OTP sent to email" };
// };

export const forgotPassword = async (userData) => {
  const { email } = userData;

  if (!email) {
    throw new Error("Email is required");
  }

  // Check if user exists
  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);

  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const otp = generateOtp();

  // OPTIONAL: store OTP in DB with expiry
  await pool.query(
    "UPDATE users SET reset_otp = $1, reset_otp_expires = NOW() + INTERVAL '5 minutes' WHERE email = $2",
    [otp, email],
  );

  // Send email (SendGrid)
  await sendOtpEmail(email, otp);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};
/* ===================== VERIFY OTP ===================== */

export const verifyResetOtp = async ({ email, otp }) => {
  const result = await pool.query(
    "SELECT reset_otp, reset_otp_expires FROM users WHERE email = $1",
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  if (user.reset_otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (new Date(user.reset_otp_expires) < new Date()) {
    throw new Error("OTP expired");
  }

  return { message: "OTP verified" };
};

/* ===================== RESET PASSWORD ===================== */

export const resetPassword = async ({ email, otp, password }) => {
  const result = await pool.query(
    "SELECT reset_otp, reset_otp_expires FROM users WHERE email = $1",
    [email],
  );

  const user = result.rows[0];

  if (user.reset_otp !== otp || new Date(user.reset_otp_expires) < new Date()) {
    throw new Error("Invalid or expired OTP");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    `UPDATE users 
     SET password = $1,
         reset_otp = NULL,
         reset_otp_expires = NULL
     WHERE email = $2`,
    [hashedPassword, email],
  );

  return { message: "Password reset successful" };
};
