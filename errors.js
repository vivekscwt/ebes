class UnhandledError extends Error {
    constructor(message) {
      super(message);
      this.name = "UnhandledError";
      this.statusCode = 500;
    }
  }
  
  class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = "NotFoundError";
      this.statusCode = 404;
    }
  }
  
  class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = "AppError";
      this.statusCode = statusCode || 400;
    }
  }
  
  module.exports = { UnhandledError, NotFoundError, AppError };