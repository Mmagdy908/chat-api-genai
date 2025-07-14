import { v2 as cloudinary } from 'cloudinary';
import ENV_VAR from '../config/envConfig';

cloudinary.config({
  cloud_name: ENV_VAR.CLOUDINARY_CLOUD_NAME,
  api_key: ENV_VAR.CLOUDINARY_CLOUD_API_KEY,
  api_secret: ENV_VAR.CLOUDINARY_CLOUD_API_SECRET,
});

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  // Upload an image
  const uploadResult = await cloudinary.uploader.upload(file.path);

  // Optimize delivery by resizing and applying auto-format and auto-quality

  const optimizeUrl = cloudinary.url(uploadResult.public_id, {
    fetch_format: 'auto',
    quality: 'auto',
    crop: 'auto',
    gravity: 'auto',
    width: 1200,
    height: 1200,
  });

  return optimizeUrl;
};
