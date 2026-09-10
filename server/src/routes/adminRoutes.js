const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { rejectProviderValidator } = require('../validators/adminValidator');

// Protect all admin routes
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Providers list
router.get('/providers', adminController.getProvidersList);

// Provider detail
router.get('/providers/:id', adminController.getProviderDetails);

// Provider approval
router.patch('/providers/:id/approve', adminController.approveProvider);

// Provider rejection
router.patch('/providers/:id/reject', rejectProviderValidator, validate, adminController.rejectProvider);

// Provider document proxy
router.get('/providers/:providerId/documents/:documentId', adminController.getProviderDocument);

module.exports = router;
