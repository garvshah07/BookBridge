import bcrypt from "bcryptjs";
import userModel from "../model/user.model.js";

export const createUser = async (userData) => {
  try {
    if (!userData) {
      throw new Error("No user data provided");
    }
    const { firstName, lastName, email, password, role } = userData;
    console.log(userData);

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    return await newUser.save();
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
};
