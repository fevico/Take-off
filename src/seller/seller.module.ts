import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Seller, sellerSchema } from './schema/seller.schema';
import { User, userSchema } from 'src/auth/schema/auth.schema';
import { EmailVerificationToken, EmailVerificationTokenSchema } from 'src/auth/schema/emailVerification.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Seller.name, schema: sellerSchema },
      { name: EmailVerificationToken.name, schema: EmailVerificationTokenSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Ensure this environment variable is set
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [SellerController],
  providers: [SellerService]
})
export class SellerModule {}
