import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { CreateOrderDto } from './dto/order.dto';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { ApiTags } from '@nestjs/swagger';

@Controller('order')
@ApiTags('Order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post('create')
    @UseGuards(AuthenticationGuard)
    async createPayment(@Body() body: any, @Res() res: any, @Req() req: Request) {
        const user = req.user.id
        return this.orderService.createPayment(body, res, user);
    }

    @Post('webhook')
    async webhook(@Body() body: any, @Res() res: any, @Req() req: any) {
        return this.orderService.webhook(req, res);
    }
}
