import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err.message, err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message?.includes('File too large')) {
    return res.status(413).json({
      success: false,
      message: 'File too large. Max size: 50MB for videos, 5MB for CSVs.',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
