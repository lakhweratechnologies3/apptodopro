import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn("Cloudinary credentials are missing. Image upload will be skipped.");
}

// Upload image buffer to Cloudinary with an extended timeout to reduce 499 timeouts
export function uploadImage(buffer, { folder = "app_uploads", timeout = 120000 } = {}) {
  if (!cloudinaryConfigured) return null;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, timeout },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!cloudinaryConfigured || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed", err);
    return null;
  }
}
