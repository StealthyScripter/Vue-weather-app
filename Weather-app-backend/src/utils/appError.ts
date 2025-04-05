export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    
    constructor(message: string, statusCode: number, isOperational: boolean = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Usage example:
  // throw new AppError('Location not found', 404);