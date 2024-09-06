import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schema/auth.schema';

@Injectable()
export class GoogleService {
    private readonly logger = new Logger(GoogleService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly jwtService: JwtService,
    ) {}

    async googleLogin(user: any): Promise<any> {
        try {
            // Check if the user exists in the database
            let dbUser = await this.userModel.findOne({ email: user.email }).exec();

            if(!dbUser){
                throw new UnauthorizedException('Please signup this user!');
            }

            // Generate a JWT token for the user
            const payload = {
                email: dbUser.email,
                id: dbUser._id,
                // Add other fields as needed
            };

            const jwtToken = this.jwtService.sign(payload, {
                secret: process.env.JWT_SECRET,
                expiresIn: '1h',
            });

            // Return user data along with JWT token
            return {
                message: 'User Info from Google',
                user: {
                    ...dbUser.toObject(), // Convert Mongoose document to plain object
                    accessToken: jwtToken,
                },
            };
        } catch (error) {
            this.logger.error('Error during Google login', error.stack);
            throw new UnauthorizedException('Error during Google login');
        }
    }

}
