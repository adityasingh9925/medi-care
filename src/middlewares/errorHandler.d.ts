import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map