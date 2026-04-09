import {
  createUser,
  forgotPassword,
  loginUser,
  verifyResetOtp,
  resetPassword,
  userById,
  updateUserProfile,
  deleteUserById,
  getAllUsers
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

export const UserByIdController = async (req, res) => {
  try {
    console.log(req)
    const { id } = req.params;
    

    const userData = await userById({ id });

    res.status(200).json({
      message: "User Data Fetch Successful",
      userData
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};


export const updateProfileController = async (req, res) => {
   try {
    const { id } = req.params;
    const { firstname, lastname, email } = req.body;

    /// Cloudinary image URL (if uploaded)
    const profile_image = req.file?.path || null;

    const updatedUser = await updateUserProfile({
      id,
      firstname,
      lastname,
      email,
      profile_image,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      userData: updatedUser,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};


export const deleteUserByIdController = async (req, res) => {
   try {
    const { id } = req.params;

    const deletedUser = await deleteUserById({ id });

    res.status(200).json({
      message: "User deleted successfully",
      userData: deletedUser,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}



export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();  
    res.status(200).json({
      message: "Users fetched successfully",
      users
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};