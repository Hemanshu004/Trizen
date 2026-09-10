const mongoose = require('mongoose');
const User = require('../models/User');
const { ProviderProfile } = require('../models/ProviderProfile');
const adminService = require('../services/adminService');
const workflowService = require('../services/workflowService');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const AdmZip = require('adm-zip');

/**
 * Get dashboard stats
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated list of providers
 * GET /api/admin/providers
 */
const getProvidersList = async (req, res, next) => {
  try {
    const result = await adminService.getProviders(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific provider's details
 * GET /api/admin/providers/:id
 */
const getProviderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid provider ID format', 400));
    }

    const result = await adminService.getProviderDetail(id);
    if (!result) {
      return next(new AppError('Provider not found', 404));
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a provider application
 * PATCH /api/admin/providers/:id/approve
 */
const approveProvider = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid provider ID format', 400));
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'provider') {
      return next(new AppError('Provider not found', 404));
    }

    // Check central state machine logic
    if (!workflowService.canTransition(user.status, 'approved')) {
      return next(new AppError(`Cannot transition provider from ${user.status} to approved`, 400));
    }

    // Atomic update to prevent race conditions
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: 'provider', status: user.status }, // Condition strictly requires existing status
      { status: 'approved' },
      { new: true }
    );

    if (!updatedUser) {
      return next(new AppError('Failed to approve provider. The application state may have been modified by another request.', 409));
    }

    res.status(200).json({
      success: true,
      message: 'Provider approved successfully',
      data: { status: updatedUser.status }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a provider application
 * PATCH /api/admin/providers/:id/reject
 */
const rejectProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionRemark } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid provider ID format', 400));
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'provider') {
      return next(new AppError('Provider not found', 404));
    }

    // Check central state machine logic
    if (!workflowService.canTransition(user.status, 'rejected')) {
      return next(new AppError(`Cannot transition provider from ${user.status} to rejected`, 400));
    }

    // Attempt atomic update of User first
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: 'provider', status: user.status },
      { status: 'rejected' },
      { new: true }
    );

    if (!updatedUser) {
      return next(new AppError('Failed to reject provider. The application state may have been modified by another request.', 409));
    }

    // Attempt to update ProviderProfile
    try {
      await ProviderProfile.findOneAndUpdate(
        { userId: id },
        { rejectionRemark: rejectionRemark.trim() }
      );
    } catch (profileError) {
      // Manual rollback if profile update fails (due to lack of replica-set transactions)
      await User.findOneAndUpdate({ _id: id }, { status: 'pending' });
      return next(new AppError('Failed to update rejection remark. Rollback performed.', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Provider rejected successfully',
      data: { status: updatedUser.status, rejectionRemark }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Proxy a provider document from Cloudinary securely
 * GET /api/admin/providers/:providerId/documents/:documentId
 */
const getProviderDocument = async (req, res, next) => {
  try {
    const { providerId, documentId } = req.params;
    const isDownload = req.query.download === 'true';

    if (!mongoose.Types.ObjectId.isValid(providerId) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return next(new AppError('Invalid ID format', 400));
    }

    const profile = await ProviderProfile.findOne({ userId: providerId });
    if (!profile) {
      return next(new AppError('Provider profile not found', 404));
    }

    const doc = profile.documents.id(documentId);
    if (!doc || !doc.publicId) {
      return next(new AppError('Document not found', 404));
    }

    // Generate Cloudinary Admin API archive URL to bypass delivery restrictions
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids: [doc.publicId],
      resource_type: 'image',
      flatten_folders: true,
    });

    // Fetch the ZIP file from Cloudinary
    const response = await fetch(zipUrl);
    if (!response.ok) {
      return next(new AppError('Failed to fetch document from Cloudinary', 500));
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Extract the single document from the ZIP
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    if (entries.length === 0) {
      return next(new AppError('Document archive was empty', 500));
    }

    const docBuffer = entries[0].getData();

    // Determine Content-Type based on extension
    let contentType = 'application/octet-stream';
    if (doc.originalName) {
      const ext = doc.originalName.split('.').pop().toLowerCase();
      if (ext === 'pdf') contentType = 'application/pdf';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', docBuffer.length);
    
    if (isDownload && doc.originalName) {
      // Force download with the original filename
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
    } else {
      // View inline in browser
      res.setHeader('Content-Disposition', 'inline');
    }

    res.status(200).send(docBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProvidersList,
  getProviderDetails,
  approveProvider,
  rejectProvider,
  getProviderDocument
};
