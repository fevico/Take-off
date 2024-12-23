import { Request } from 'express';

declare module 'express' {
  export interface Request {
    userId?: string;
    user?: {
      id: string;
      role: string;
      name: string;
      address: string;
      phone: string;
      avatar: string;
      email: string;
      // Add other user properties as needed
    };
  }
}
