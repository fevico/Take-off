import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schema/auth.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      prompt: 'consent' // Ensure the consent screen is shown
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    try {
      const { emails, displayName } = profile;
      const email = emails[0].value;

      // Check if the user exists in your system
      let user = await this.userModel.findOne({ email });

    //   if (!user) {
    //     throw new UnauthorizedException('You must sign up through normal login first.');
    //   }
    if(!user){
      const newUser = new this.userModel({
        email,
        name: displayName,
        isVerified: true,
      });
      await newUser.save();
      user = newUser;
    }

      // Generate a JWT token for the user
      const payload = {
        email: user.email,
        id: user._id,
        role: user.role,
      };

      const jwtToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });
      console.log('Generated JWT Token:', jwtToken);

      // Return user data along with JWT token
      done(null, { ...user.toObject(), accessToken: jwtToken });
    } catch (error) {
      console.log('Error in Google Strategy:', error);
      done(error, false);
    }
  }
}
