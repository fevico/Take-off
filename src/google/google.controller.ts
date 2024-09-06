import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleService } from './google.service';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Google')
@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
   
  }

  @Get('auth/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
        // Ensure req.user is correctly passed to googleLogin
        if (!req.user) {
          throw new Error('No user found in request');
        }
  
        const user = await this.googleService.googleLogin(req.user);
        return res.json(user);
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }

  }
}
