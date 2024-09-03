import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

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
} 
