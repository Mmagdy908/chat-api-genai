import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import ENV_VAR from '../config/envConfig';

cloudinary.config({
  cloud_name: ENV_VAR.CLOUDINARY_CLOUD_NAME,
  api_key: ENV_VAR.CLOUDINARY_CLOUD_API_KEY,
  api_secret: ENV_VAR.CLOUDINARY_CLOUD_API_SECRET,
});

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  // Upload an image
  const uploadResult = await cloudinary.uploader.upload(file.path, {
    use_filename: true,
    display_name: file.originalname,
    filename_override: file.originalname,
  });

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

export const uploadVideo = async (file: Express.Multer.File): Promise<string> => {
  // Upload a video
  const uploadResult = (await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      file.path,
      {
        resource_type: 'video',
        use_filename: true,
        display_name: file.originalname,
        filename_override: file.originalname,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      }
    );
  })) as UploadApiResponse;

  return uploadResult.secure_url;
};

export const uploadAudio = async (file: Express.Multer.File): Promise<string> => {
  // Upload an audio
  const uploadResult = await cloudinary.uploader.upload(file.path, {
    resource_type: 'video',
    use_filename: true,
    display_name: file.originalname,
    filename_override: file.originalname,
  });

  return uploadResult.secure_url;
};

export const uploadDocument = async (file: Express.Multer.File): Promise<string> => {
  // Upload an audio
  const uploadResult = await cloudinary.uploader.upload(file.path, {
    resource_type: 'raw',
    use_filename: true,
    display_name: file.originalname,
    filename_override: file.originalname,
  });

  return uploadResult.secure_url;
};
