const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Uploads a file buffer to Cloudinary via stream.
 * @param {Buffer} buffer - The file buffer from Multer
 * @param {string} folder - The Cloudinary folder to store the asset
 * @param {string} [originalName] - The original filename
 * @returns {Promise<Object>} - The Cloudinary response object containing url and public_id
 */
const uploadStream = (buffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto'
    };
    
    if (originalName) {
      // Cloudinary will extract the extension and use it as the format
      const parts = originalName.split('.');
      if (parts.length > 1) {
        uploadOptions.format = parts[parts.length - 1].toLowerCase();
      }
    }

    const cld_upload_stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

/**
 * Deletes an asset from Cloudinary.
 * @param {string} publicId - The public ID of the Cloudinary asset
 * @returns {Promise<Object>} - The Cloudinary response
 */
const deleteAsset = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) return resolve({ result: 'not found' });
    
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary destroy error:', error);
        return reject(error);
      }
      resolve(result);
    });
  });
};

module.exports = {
  uploadStream,
  deleteAsset
};
