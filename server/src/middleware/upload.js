const multer = require('multer');
const AppError = require('../utils/AppError');

// Memory storage keeps the file in memory as a Buffer.
const storage = multer.memoryStorage();

// Profile Photo Configuration
// Allowed: jpeg, png, webp. Max: 5MB
const photoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Only JPEG, PNG, and WEBP are allowed for profile photos.', 400), false);
  }
};

const uploadPhoto = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: photoFileFilter
});

// Verification Document Configuration
// Allowed: pdf, jpeg, png. Max: 10MB
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Only PDF, JPEG, and PNG are allowed for documents.', 400), false);
  }
};

const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: documentFileFilter
});

module.exports = {
  uploadPhoto,
  uploadDocument
};
