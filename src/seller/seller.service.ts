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
import { SellerVerificationToken } from './schema/sellerToken';
import { BecomeSellerDto } from './dto/seller.dto';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SellerVerificationToken.name)
    private sellerVerificationModel: Model<SellerVerificationToken>,
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
    await this.sellerVerificationModel.create({ token, owner: user._id });

    // Assuming sendEmailVerification is a function to send email notifications
    // await sendEmailVerification(user.email, token);

    return { message: 'Verification token sent to your email', token };
  }
}
