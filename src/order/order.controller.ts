import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post('create')
    async createPayment(@Body() body: any, @Res() res: any) {
        return this.orderService.createPayment(body, res);
    }
    
    @Post('webhook')
    async webhook(@Body() body: any, @Res() res: any, @Req() req: Request) {
        return this.orderService.webhook(body, res, req);
    }
}
