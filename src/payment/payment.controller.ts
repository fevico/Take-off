import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private PaymentService: PaymentService) {}

    @Post('create')
    async createPayment(@Body() body: any, @Res() res: any) {
        return this.PaymentService.createPayment(body, res);
    }

    @Get('verify-payment/:reference')
    async verifyPayment(
      @Param('reference') reference: string,
      @Req() req: Request,
      @Res() res: Response,
    ) {
      return this.PaymentService.verifyPayment(reference, res);
    }
}
