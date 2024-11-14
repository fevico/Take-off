import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, userSchema } from 'src/auth/schema/auth.schema';
import { Cart, CartSchema } from './schema/cart';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5d' },
    }),
  ],
  providers: [CartService],
  controllers: [CartController]
})
export class CartModule {}
