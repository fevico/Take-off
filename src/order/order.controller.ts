import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { CreateOrderDto } from './dto/order.dto';
import { AuthenticationGuard } from 'src/guards/Authentication';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post('create')
    @UseGuards(AuthenticationGuard)
    async createPayment(@Body() body: any, @Res() res: any, @Req() req: Request) {
        const user = req.user.id
        return this.orderService.createPayment(body, res, user);
    }

    @Post('webhook')
    async webhook(@Body() body: any, @Res() res: any, @Req() req: Request) {
        return this.orderService.webhook(req, res);
    }
}
