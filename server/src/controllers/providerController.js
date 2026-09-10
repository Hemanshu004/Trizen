const { ProviderProfile, VALID_CATEGORIES } = require('../models/ProviderProfile');
const { calculateProfileCompleteness } = require('../services/providerService');
const workflowService = require('../services/workflowService');
const AppError = require('../utils/AppError');

/**
 * Get current provider's profile
 * GET /api/providers/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    let profile = await ProviderProfile.findOne({ userId: user._id });

    // Fallback: create if it somehow doesn't exist, though authController should handle this.
    if (!profile) {
      profile = await ProviderProfile.create({ userId: user._id });
    }

    const { isComplete, missingFields } = calculateProfileCompleteness(profile, user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        profile: {
          phone: profile.phone || '',
          categories: profile.categories || [],
          skills: profile.skills || [],
          experience: profile.experience, // can be 0 or undefined
          serviceLocation: profile.serviceLocation || {},
          profilePhoto: profile.profilePhoto || null,
          documents: profile.documents || [],
          rejectionRemark: profile.rejectionRemark || null,
        },
        meta: {
          isComplete,
          missingFields,
          validCategories: VALID_CATEGORIES
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current provider's profile
 * PUT /api/providers/me
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Check workflow state: Cannot edit if pending or approved
    if (!workflowService.canEditProfile(user.status)) {
      return next(new AppError(`Profile cannot be edited while application is ${user.status}`, 403));
    }

    const { name, phone, categories, skills, experience, serviceLocation } = req.body;

    // Update User model (name)
    if (name) {
      user.name = name;
      await user.save();
    }

    // Update ProviderProfile model
    const profile = await ProviderProfile.findOne({ userId: user._id });
    if (!profile) {
      return next(new AppError('Profile not found', 404)); // Shouldn't happen
    }

    if (phone !== undefined) profile.phone = phone;
    if (categories !== undefined) profile.categories = categories;
    if (skills !== undefined) profile.skills = skills;
    if (experience !== undefined) profile.experience = experience;
    
    if (serviceLocation) {
      profile.serviceLocation = {
        ...profile.serviceLocation,
        ...serviceLocation
      };
    }

    await profile.save();

    const { isComplete, missingFields } = calculateProfileCompleteness(profile, user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          status: user.status
        },
        profile,
        meta: {
          isComplete,
          missingFields
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit provider application
 * POST /api/providers/me/submit
 */
const submitApplication = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if the state transition is valid
    if (!workflowService.canTransition(user.status, 'pending')) {
      return next(new AppError(`Cannot submit application from status: ${user.status}`, 403));
    }

    const profile = await ProviderProfile.findOne({ userId: user._id });
    const { isComplete, missingFields } = calculateProfileCompleteness(profile, user);

    if (!isComplete) {
      return next(new AppError(`Profile is incomplete. Missing fields: ${missingFields.join(', ')}`, 400));
    }

    // Clear previous rejection remark if transitioning from rejected
    if (user.status === 'rejected') {
      profile.rejectionRemark = null;
      await profile.save();
    }

    // Update user status
    user.status = 'pending';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider application status
 * GET /api/providers/me/status
 */
const getStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await ProviderProfile.findOne({ userId: user._id });
    const { isComplete, missingFields } = calculateProfileCompleteness(profile, user);

    res.status(200).json({
      success: true,
      data: {
        status: user.status,
        rejectionRemark: profile?.rejectionRemark || null,
        profileComplete: isComplete,
        missingFields
      }
    });
  } catch (error) {
    next(error);
  }
};

const { uploadStream, deleteAsset } = require('../services/cloudinaryService');

/**
 * Upload profile photo
 * POST /api/providers/me/photo
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!workflowService.canUploadFiles(user.status)) {
      return next(new AppError(`Uploads are not allowed while application is ${user.status}`, 403));
    }

    if (!req.file) {
      return next(new AppError('Please provide a valid photo file', 400));
    }

    const profile = await ProviderProfile.findOne({ userId: user._id });
    const oldPublicId = profile.profilePhoto?.publicId;

    // Upload to Cloudinary
    const result = await uploadStream(req.file.buffer, 'service-provider-portal/profile-photos');

    // Update profile
    profile.profilePhoto = {
      url: result.secure_url,
      publicId: result.public_id
    };
    await profile.save();

    // Clean up old asset if it exists
    if (oldPublicId) {
      // Background cleanup, no need to await/block
      deleteAsset(oldPublicId).catch(err => console.error('Failed to cleanup old photo:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: profile.profilePhoto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload verification document (single file per request)
 * POST /api/providers/me/documents
 */
const uploadVerificationDocument = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!workflowService.canUploadFiles(user.status)) {
      return next(new AppError(`Uploads are not allowed while application is ${user.status}`, 403));
    }

    if (!req.file) {
      return next(new AppError('Please provide a valid document file', 400));
    }

    const { documentType } = req.body;
    const allowedTypes = ['identity', 'address_proof', 'certification', 'other'];
    if (!allowedTypes.includes(documentType)) {
      return next(new AppError(`Invalid document type. Allowed: ${allowedTypes.join(', ')}`, 400));
    }

    const profile = await ProviderProfile.findOne({ userId: user._id });
    
    if (profile.documents && profile.documents.length >= 5) {
      return next(new AppError('Maximum limit of 5 documents reached', 400));
    }

    // Upload to Cloudinary
    const result = await uploadStream(
      req.file.buffer, 
      'service-provider-portal/provider-documents',
      req.file.originalname
    );

    const newDoc = {
      type: documentType,
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname
    };

    profile.documents.push(newDoc);
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: profile.documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete verification document
 * DELETE /api/providers/me/documents/:id
 */
const deleteVerificationDocument = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!workflowService.canUploadFiles(user.status)) {
      return next(new AppError(`Uploads/deletions are not allowed while application is ${user.status}`, 403));
    }

    const documentId = req.params.id;
    const profile = await ProviderProfile.findOne({ userId: user._id });

    // Find document in profile
    const doc = profile.documents.id(documentId);
    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    // Delete from Cloudinary
    if (doc.publicId) {
      try {
        await deleteAsset(doc.publicId);
      } catch (err) {
        return next(new AppError('Failed to delete document from storage provider', 500));
      }
    }

    // Remove from MongoDB
    profile.documents.pull(documentId);
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: profile.documents
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  submitApplication,
  getStatus,
  uploadProfilePhoto,
  uploadVerificationDocument,
  deleteVerificationDocument
};
