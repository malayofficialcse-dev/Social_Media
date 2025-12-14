import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary automatically configures itself if CLOUDINARY_URL is present in env.
// However, we can also explicitly set config if needed, but CLOUDINARY_URL is preferred.

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Check if the file is an audio file
    if (file.mimetype.startsWith('audio/')) {
      return {
        folder: 'innobytes/audio',
        resource_type: 'video', // Cloudinary handles audio under 'video' resource type
        allowed_formats: ['mp3', 'wav', 'webm', 'm4a'],
      };
    }
    
    // Default to image
    return {
      folder: 'innobytes',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    };
  },
});

const upload = multer({ storage: storage });

export { cloudinary, upload };
