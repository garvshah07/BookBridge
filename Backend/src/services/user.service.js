import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../src/config/db.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const createUser = async (userData) => {
  try {
    if (!userData) {
      throw new Error("No user data provided");
    }
    const { firstname, lastname, email, password, role = "User" } = userData;

    const existingUser = await pool.query(
      `SELECT email FROM users WHERE email = $1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users ( firstname, lastname, email, password , role)
     VALUES ($1, $2, $3 , $4, $5)
     RETURNING id ,firstname, lastname, email, password, role`,
      [firstname, lastname, email, hashedPassword, role],
    );

    return await result.rows[0];
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
};

export const loginUser = async (userData) => {
  try {
    const { email, password } = userData;

    const result = await pool.query(
      `SELECT email FROM users WHERE email = $1`,
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
