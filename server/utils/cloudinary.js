// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'driver-documents',
          resource_type: 'auto',
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
    
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// ============ GENERATE SIGNED URL ============
const getSignedUrl = (publicId, options = {}) => {
  try {
    // Generate a URL that expires in 5 minutes (300 seconds)
    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
      resource_type: 'auto',
      ...options
    });
    
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// ============ GET PUBLIC ID FROM URL (for backward compatibility) ============
const getPublicIdFromUrl = (fileUrl) => {
  try {
    const urlParts = fileUrl.split('/');
    const filenameWithVersion = urlParts[urlParts.length - 1];
    const publicId = filenameWithVersion.split('.')[0];
    return publicId;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getSignedUrl,
  getPublicIdFromUrl
};