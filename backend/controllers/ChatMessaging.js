import { uploadFilesToCloudinary } from "../lib/helpers.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { TryCatch } from "../middlewares/error.js";
import Message from "../models/ChatMessaging.js";
import ErrorHandler from "../utils/errorHandler.js";

const sendMessage = TryCatch(async (req, res, next) => {
  const { id: receiverId } = req.params;
  const { text, image } = req.body;

  const senderId = req.user;

  if (!receiverId)
    return next(new ErrorHandler(400, "Receiver id is required"));
  if (!text && !image)
    return next(new ErrorHandler(400, "At least text or image is required"));

  let imageUrl;
  if (image) {
    const uploadimage = await uploadFilesToCloudinary(image);
    imageUrl = {
      public_id: uploadimage[0].public_id,
      url: uploadimage[0].url,
    };
  }

  const message = await Message.create({
    senderId,
    receiverId,
    text,
    image: imageUrl,
  });

  res.status(201).json({ success: true, message });
});

export { sendMessage };
