const { body } = require('express-validator');

exports.rejectProviderValidator = [
  body('rejectionRemark')
    .exists({ checkFalsy: true }).withMessage('Rejection remark is required')
    .isString().withMessage('Rejection remark must be a string')
    .trim()
    .notEmpty().withMessage('Rejection remark cannot be empty or whitespace only')
    .isLength({ max: 1000 }).withMessage('Rejection remark cannot exceed 1000 characters')
];
