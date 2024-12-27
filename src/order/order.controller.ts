import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from 'src/guards/Authorization';
import { Roles } from 'src/decorator/role.decorator';

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

    @Roles(['admin', 'seller'])
    @Get('details')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    async orderDetailsBySeller(@Req() req: Request){
        const user = req.user.id
        return this.orderService.orderDetailsBySeller(user);
    }

    @Get('/buyer')
    @ApiOperation({ summary: 'Get orders by buyer ID' })
    @ApiResponse({ status: 200, description: 'List of orders belonging to the buyer' })
    @ApiResponse({ status: 404, description: 'Buyer not found' })
    async getOrdersByBuyer(@Req() req: Request) {
        const buyerId = req.user.id;
      return this.orderService.getOrdersByBuyer(buyerId);
    }

    @Get('/seller/:sellerId')
    @ApiOperation({ summary: 'Get orders by seller ID' })
    @ApiResponse({ status: 200, description: 'List of orders belonging to the seller' })
    @ApiResponse({ status: 404, description: 'Seller not found' })
    async getOrdersBySeller(@Req() req: Request) {
        const sellerId = req.user.id;
      return this.orderService.getOrdersBySeller(sellerId);
    }
  
    @Post('webhook')
    @ApiOperation({
      summary: 'Paystack webhook handler',
      description: 'Handles incoming Paystack webhook events.',
    })
    @ApiBody({
      description: 'Paystack webhook payload',
      schema: {
        type: 'object',
        properties: {
          event: {
            type: 'string',
            example: 'charge.success',
            description: 'Type of event triggered by Paystack.',
          },
          data: {
            type: 'object',
            properties: {
              reference: {
                type: 'string',
                example: '5a3pu3flo8',
                description: 'Unique reference for the transaction.',
              },
              metadata: {
                type: 'object',
                properties: {
                  orderId: {
                    type: 'string',
                    example: '676c5ca69ce6e0ea028563ae',
                    description: 'Unique ID for the order.',
                  },
                },
              },
            },
          },
        },
      },
      required: true,
    })
    @ApiResponse({
      status: 200,
      description: 'Webhook successfully processed.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Payment processed successfully',
          },
        },
      },
    })
    @ApiResponse({
      status: 400,
      description: 'Invalid request or signature mismatch.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Invalid signature',
          },
        },
      },
    })
    @ApiResponse({
      status: 404,
      description: 'Order not found.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Order not found',
          },
        },
      },
    })
    @ApiResponse({
      status: 500,
      description: 'Server error.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Server error',
          },
        },
      },
    })
    async webhook(@Body() body: any, @Res() res: any, @Req() req: any) {
      return this.orderService.webhook(req, res);
    }

    
    @Get('by-reference/:reference')
    @UseGuards(AuthenticationGuard)
    async orderDetailsByReference(@Param("reference") reference: string, @Body() body: any, @Req() req: Request){
        const user = req.user.id
        return this.orderService.orderDetailsByReference(reference);
    }
  
}
