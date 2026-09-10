const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors cleanly
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push(err.msg));

  return res.status(400).json({
    success: false,
    message: extractedErrors.join('. ')
  });
};

module.exports = validate;
