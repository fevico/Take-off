
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as formidable from 'formidable';

@Injectable()
export class UploadMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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

  



