/**
 * Custom application error class.
 * Carries an HTTP status code and an operational flag
 * so the centralized error handler can distinguish
 * expected errors from unexpected crashes.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
