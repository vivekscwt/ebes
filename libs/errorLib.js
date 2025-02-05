// ====== Used to throw different errors =====//
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class NotFoundError extends AppError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
  }
  
  class ValidationError extends AppError {
    constructor(message = "Validation Error") {
        super(message, 400);
    }
  }
  class DuplicateEntryError extends AppError {
    constructor(message = "Duplicate Entry") {
        super(message, 400);
    }
  }
  
  class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
  }
  
  class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
  }
  
  class BadrequestError extends AppError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
  }
  
  class UnhandledError extends AppError {
    constructor(message = "Error while performing your request.") {
        super(message, 500);
    }
  }
  
  module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    DuplicateEntryError,
    BadrequestError,
    UnhandledError,
  };
  