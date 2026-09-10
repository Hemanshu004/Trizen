const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  submitApplication, 
  getStatus,
  uploadProfilePhoto,
  uploadVerificationDocument,
  deleteVerificationDocument
} = require('../controllers/providerController');
const { updateProfileValidation } = require('../validators/providerValidator');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPhoto, uploadDocument } = require('../middleware/upload');

const router = express.Router();

// All provider routes require authentication and provider role
router.use(authenticate, authorize('provider'));

router.get('/me', getProfile);
router.put('/me', updateProfileValidation, updateProfile);
router.post('/me/submit', submitApplication);
router.get('/me/status', getStatus);

// Upload routes
router.post('/me/photo', uploadPhoto.single('photo'), uploadProfilePhoto);
router.post('/me/documents', uploadDocument.single('document'), uploadVerificationDocument);
router.delete('/me/documents/:id', deleteVerificationDocument);

module.exports = router;
