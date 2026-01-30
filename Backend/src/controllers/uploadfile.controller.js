import { UploadFile } from "../services/uploadfile.service.js";

export const uploadFileController = async (req, res) => {
  try {
    const user = await req.user;
    const fileData = await UploadFile(req.file, user);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: fileData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
