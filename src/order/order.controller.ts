import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    // @Post('create')
    // async createOrder(@Body() createOrderDto: CreateOrderDto) {
    //     return this.orderService.createOrder(createOrderDto);
    // }
}
