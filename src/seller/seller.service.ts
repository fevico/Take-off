import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/schema/auth.schema';
import { Seller } from 'src/seller/schema/seller.schema';
import { generateToken } from 'src/utils/token';
import { BecomeSellerDto } from './dto/seller.dto';
import { EmailVerificationToken } from 'src/auth/schema/emailVerification.shema';
import * as bcrypt from 'bcrypt';


@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(EmailVerificationToken.name) private sellerVerificationModel: Model<EmailVerificationToken>,
  ) {}

  async becomeSeller(body: BecomeSellerDto) {
    const { email } = body;
    if (!email) {
        throw new BadRequestException('Email is required');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const token = generateToken();
    const hashedToken = await bcrypt.hash(token, 10);

    // Use upsert (create if doesn't exist, update if it does)
    await this.sellerVerificationModel.findOneAndUpdate(
        { owner: user._id },
        { token: hashedToken, owner: user._id, createdAt: new Date() },
        { upsert: true }
    );

    // Assuming sendEmailVerification is a function to send email notifications
    // await sendEmailVerification(user.email, token);

    return { message: 'Verification token sent to your email', status: 200 };
}

}
