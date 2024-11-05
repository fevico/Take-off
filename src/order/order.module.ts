import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, orderSchema } from './schema/order.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name: Order.name, schema:orderSchema}]),
  JwtModule.register({
    secret: process.env.JWT_SECRET, // Ensure this environment variable is set
    signOptions: { expiresIn: '1d' },
  }),
],
  providers: [OrderService],
  controllers: [OrderController]
})
export class OrderModule {}
