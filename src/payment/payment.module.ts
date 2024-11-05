import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, paymentSchema } from './schema/payment.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name: Payment.name, schema:paymentSchema}]),
  JwtModule.register({
    secret: process.env.JWT_SECRET, // Ensure this environment variable is set
    signOptions: { expiresIn: '1d' },
  }),
],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}
