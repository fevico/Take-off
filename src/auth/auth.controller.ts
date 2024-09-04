import { Body, Controller, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenitcationGuard } from 'src/guards/Authentication';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('create')
    createUser(@Body() body: any){
        return this.authService.createUser(body)
    }

    @Post('resend-token')
    resendToken(@Body() body: any){
        return this.authService.resendToken(body)
    }
    
    @Post('verify-email')
    verifyEmail(@Body() body: any){ 
        return this.authService.verifyEmail(body)
    }

    @Post('login')
    login(@Body() body: any){
        return this.authService.login(body)
    }

    @Put('register')
    register(@Body() body: any){
        return this.authService.register(body)
    }

    @Patch('update-profile')
    @UseGuards(AuthenitcationGuard)
    updateProfile(@Body() body: any, @Req() req: Request){
        const fields = req.body as Record<string, any>; // Use a more specific type if possible
        const files = req['files'] as Record<string, any>;
        const userId = req.user.id
    
        // Check and convert if fields.name is an array
        if (Array.isArray(fields.avatar)) {
          fields.avatar = fields.avatar[0];
        }    
        if (Array.isArray(fields.name)) {
          fields.name = fields.name[0];
        }    
        if (Array.isArray(fields.address)) {
          fields.address = fields.address[0];
        }    
        if (Array.isArray(fields.phone)) {
          fields.phone = fields.phone[0];
        }    
        return this.authService.updateProfile(body, fields, files, userId)
    }
} 
