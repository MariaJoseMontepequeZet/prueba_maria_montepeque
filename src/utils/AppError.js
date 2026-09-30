class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) { return new AppError(400, message, details); }
  static notFound(message) { return new AppError(404, message); }
  static methodNotAllowed(message) { return new AppError(405, message); }
  static conflict(message) { return new AppError(409, message); }
  static payloadTooLarge(message) { return new AppError(413, message); }
  static unsupportedMediaType(message) { return new AppError(415, message); }
}

module.exports = AppError;
