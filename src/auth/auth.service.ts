import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/auth.schema';
import * as bcrypt from 'bcrypt';
import { generateToken } from 'src/utils/token';
import { EmailVerificationToken } from './schema/emailVerification.shema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(EmailVerificationToken.name) private readonly emailVerificationTokenModel: Model<EmailVerificationToken>,
    private readonly jwtService: JwtService
){}

    async createUser(body: any){
        const {email, password} = body;
        const emailExist = await this.userModel.findOne({ email });
        if (emailExist) {
          throw new UnauthorizedException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new this.userModel({
          ...body, // Spread registerDto first
          password: hashedPassword, // Then overwrite the password with the hashed password
        });
             await newUser.save();

         const token = generateToken()
         const hashedToken = await bcrypt.hash(token, 10)
         console.log(token)
         await this.emailVerificationTokenModel.create({token:hashedToken, owner: newUser._id})
         return {message: 'User created successfully!', token: token, id: newUser._id};
    }

    async resendToken(body: any){
        const {email} = body
        const user = await this.userModel.findOne({email})
        if(!user) throw new UnauthorizedException('Invalid request!,no user found with this credentials')
            if(user.isVerified) throw new UnauthorizedException('User already verified')
        const token = generateToken()
        console.log(token)
        const hashedToken = await bcrypt.hash(token, 10)
        await this.emailVerificationTokenModel.deleteOne({owner: user._id})
        await this.emailVerificationTokenModel.create({token:hashedToken, owner: user._id})
        return {message: 'Email sent successfully!', token, userId: user._id}
    }

    async verifyEmail(body: any){
        const {token, id} = body
        const user = await this.userModel.findById(id)
        if(!user) throw new UnauthorizedException('Invalid user')
        const emailVerificationToken = await this.emailVerificationTokenModel.findOne({owner:id})
        if(!emailVerificationToken){
            throw new UnauthorizedException('Invalid token')
        }
        const isTokenMatch = await bcrypt.compare(token, emailVerificationToken.token)
        if(!isTokenMatch) throw new UnauthorizedException('Invalid token')
        user.isVerified = true;
        await user.save()
        await this.emailVerificationTokenModel.deleteOne({owner:id})
        return {message: 'Email verified successfully!'}
    }

    async login(body: any){
        const user = await this.userModel.findOne({email: body.email})
        if(!user){
            throw new NotFoundException('User not found')
        }
        const isPasswordMatch = await bcrypt.compare(body.password, user.password)
        if(!isPasswordMatch){
            throw new UnauthorizedException('Invalid email/password')
        }
        const payload = {email: user.email, id: user._id}
        const token = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET, expiresIn: '1h'})
        return {token, data:{email: user.email, id: user._id, role: user.role}}
    }
}
