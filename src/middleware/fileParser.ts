
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as formidable from 'formidable';

@Injectable()
export class UploadMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // const relevantRoutes = ['/your-route-1', '/your-route-2'];
    // if (!relevantRoutes.includes(req.path)) {
    //   return next(); // Skip middleware for non-relevant routes
    // }
    const form = new formidable.IncomingForm();
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error during form parsing:', err);
        next(err);
        return;
      }
      
      
      req.body = fields;  // Attach fields to req.body
      req['files'] = files;  // Attach files to req['files']
      
      
      next();
    });
      

  }
    
}

  



