import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/auth.schema';
import * as bcrypt from 'bcrypt';
import { generateToken } from 'src/utils/token';
import { EmailVerificationToken } from './schema/emailVerification.shema';
import { JwtService } from '@nestjs/jwt';
import cloudUploader from 'src/cloud';
import {
  LoginDto,
  RegisterUserDto,
  ResendTokenDto,
  SignUpDto,
  VerifyTokenDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(EmailVerificationToken.name)
    private readonly emailVerificationTokenModel: Model<EmailVerificationToken>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(body: SignUpDto) {
    try {
        const { email, password, role } = body;
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
    
        const token = generateToken();
        const hashedToken = await bcrypt.hash(token, 10);
        await this.emailVerificationTokenModel.create({
          token: hashedToken,
          owner: newUser._id,
        });
        return {
          status: true,
          statusCode: 200,
          message: 'User created successfully!',
          token: token,
          id: newUser._id,
        };
    } catch (error) {
        throw new UnprocessableEntityException(error.message);
    }

  }

  async resendToken(body: ResendTokenDto) {
    try {
      const { email } = body;
      const user = await this.userModel.findOne({ email });
      if (!user)
        throw new UnauthorizedException(
          'Invalid request!,no user found with this credentials',
        );
      if (user.isVerified)
        throw new UnauthorizedException('User already verified');
      const token = generateToken();
      console.log(token);
      const hashedToken = await bcrypt.hash(token, 10);
      await this.emailVerificationTokenModel.deleteOne({ owner: user._id });
      await this.emailVerificationTokenModel.create({
        token: hashedToken,
        owner: user._id,
      });
      return { message: 'Email sent successfully!', token, userId: user._id };
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async verifyEmail(body: VerifyTokenDto) {
    const { token, userId } = body;
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid user');
    const emailVerificationToken =
      await this.emailVerificationTokenModel.findOne({ owner: userId });
    if (!emailVerificationToken) {
      throw new UnauthorizedException('Invalid token');
    }
    const isTokenMatch = await bcrypt.compare(
      token,
      emailVerificationToken.token,
    );
    if (!isTokenMatch) throw new UnauthorizedException('Invalid token');
    if(user.isVerified === true && user.isApproved === false){
      return { message: 'Email verified to be a seller!', status: 200 };
    }else{
      user.isVerified = true;
      await user.save();  
    }
    await this.emailVerificationTokenModel.deleteOne({ owner: userId });
    return { message: 'Email verified successfully!' };
  }

  async login(body: LoginDto) {
    try {
        const user = await this.userModel.findOne({ email: body.email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordMatch = await bcrypt.compare(body.password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid email/password');
    }
    const payload = { email: user.email, id: user._id, name: user.name, address: user.address, role: user.role};
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '5d',
    });
    return {
      status: true,
      token,
      data: { email: user.email, id: user._id, role: user.role, name: user.name },
      statusCode: 200,
    };
    } catch (error) {
        throw new UnprocessableEntityException(error.message);
    }
    
  }

  async register(body: RegisterUserDto) {
    const { name, phone, userId } = body;
    const emailExist = await this.userModel.findById({ userId });
    if (emailExist) {
      throw new UnauthorizedException('Email already exists');
    }

    if (!emailExist.isVerified)
      throw new UnauthorizedException(
        'Please verify your email first before you can update your profile',
      );

    const newUser = this.userModel.findByIdAndUpdate(
      userId,
      { name, phone },
      { new: true },
    );
    return newUser;
  }

  async updateProfile(fields: any, files: any, userId: string) {
    let { avatar } = files;
    const { name, address, phone, password } = fields;

    try {
        if (avatar) {
            if (Array.isArray(avatar)) {
              if (avatar.length > 1) {
                throw new UnprocessableEntityException(
                  'Multiple files are not allowed!',
                );
              }
              avatar = avatar[0];
            }
      
            if (!avatar.mimetype?.startsWith('image')) {
              throw new UnprocessableEntityException('Invalid image file!');
            }
          }
      
          const user = await this.userModel.findById(userId);
          if (!user) throw new UnauthorizedException('Access denied!');
      
          if (avatar && user.avatar?.id) {
            // Remove existing avatar file
            await cloudUploader.destroy(user.avatar.id);
          }
      
          let updatedAvatar = user.avatar;
          if (avatar) {
            // Upload new avatar to Cloudinary
            const { secure_url: url, public_id: id } = await cloudUploader.upload(
              avatar.filepath,
              {
                width: 300,
                height: 300,
                crop: 'thumb',
                gravity: 'face',
              },
            );
            updatedAvatar = { id, url };
          }

          if(password){
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(password, salt);
            const updateUser = await this.userModel.findByIdAndUpdate(
              userId,
              { name, address, phone, avatar: updatedAvatar, password: hashedPassword },
              { new: true },
            );
      
            return {status: true, statusCode: 200, updateUser};
          }
      
          // const updateUser = await this.userModel.findByIdAndUpdate(
          //   userId,
          //   { name, address, phone, avatar: updatedAvatar },
          //   { new: true },
          // );
      
          // return {status: true, statusCode: 200, updateUser};
    } catch (error) {
        throw new UnprocessableEntityException(error.message);
    }

    
  }

  async getUserGrowthData(): Promise<any> {
    const currentDate = new Date();
    const startDate = new Date('2023-01-01'); // Example: earliest start date you want
    const endDate = currentDate; // Default to the current date

    const monthlyUserGrowth = await this.userModel.aggregate([
      {
        // Match users created within the specific date range
        $match: {
          createdAt: {
            $gte: startDate, // Use startDate
            $lte: endDate,   // Use endDate
          },
        },
      },
      {
        // Group by year and month of the createdAt field
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          userCount: { $sum: 1 }, // Count the number of users created
        },
      },
      {
        // Project the year and month in a readable format
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          userCount: 1,
        },
      },
      {
        // Sort by year and month
        $sort: { year: 1, month: 1 },
      },
    ]);

    return { data: monthlyUserGrowth };
  }

}
