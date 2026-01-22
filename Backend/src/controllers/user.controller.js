import {
  createUser,
  forgotPassword,
  loginUser,
  verifyResetOtp,
  resetPassword,
} from "../services/user.service.js";

export const createUserController = async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUserController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const tokenData = await loginUser({ email, password });

    res.status(200).json({
      message: "Login successful",
      ...tokenData,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const forgotPasswordUserController = async (req, res) => {
  try {
    const response = await forgotPassword(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const response = await verifyResetOtp(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const response = await resetPassword(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
