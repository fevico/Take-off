import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';
import { JwtModule } from '@nestjs/jwt';
import { User, userSchema } from 'src/auth/schema/auth.schema';

@Module({
  imports:[MongooseModule.forFeature([
    {name: Order.name, schema:OrderSchema},
    {name: User.name, schema:userSchema},
  ]),
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '5d' },
  }),
],
  providers: [OrderService],
  controllers: [OrderController]
})
export class OrderModule {}
