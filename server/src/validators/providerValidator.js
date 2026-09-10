const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { VALID_CATEGORIES } = require('../models/ProviderProfile');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(e => e.msg).join('. ');
    return next(new AppError(msg, 400));
  }
  next();
};

const updateProfileValidation = [
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  
  body('categories')
    .optional()
    .isArray().withMessage('Categories must be an array')
    .custom((categories) => {
      if (!categories.every(cat => VALID_CATEGORIES.includes(cat))) {
        throw new Error('One or more invalid categories selected');
      }
      return true;
    }),
  
  body('skills')
    .optional()
    .isArray({ max: 50 }).withMessage('Skills must be an array with max 50 items')
    .custom((skills) => {
      if (!skills.every(skill => typeof skill === 'string' && skill.trim().length > 0)) {
        throw new Error('Skills must be non-empty strings');
      }
      return true;
    }),

  body('experience')
    .optional({ nullable: true })
    .isNumeric().withMessage('Experience must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Experience cannot be negative');
      }
      return true;
    }),

  body('serviceLocation')
    .optional()
    .isObject().withMessage('Service location must be an object'),

  body('serviceLocation.pincode')
    .optional()
    .trim()
    .matches(/^[1-9][0-9]{5}$/).withMessage('Invalid Indian pincode format'),
    
  // explicitly reject attempts to modify protected fields via validation
  body('role').not().exists().withMessage('Cannot modify role'),
  body('status').not().exists().withMessage('Cannot modify status'),
  body('rejectionRemark').not().exists().withMessage('Cannot modify rejection remark'),
  body('documents').not().exists().withMessage('Cannot modify documents directly'),
  body('profilePhoto').not().exists().withMessage('Cannot modify profile photo directly'),

  validate,
];

module.exports = {
  updateProfileValidation,
};
