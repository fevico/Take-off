import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
        return this.orderService.createPayment(body, res, req, user);
    }

    // @Roles(['admin', 'seller'])
    // @Get('details')
    // @UseGuards(AuthenticationGuard, AuthorizationGuard)
    // async orderDetailsBySeller(@Req() req: Request){
    //     const user = req.user.id
    //     return this.orderService.orderDetailsBySeller(user);
    // }

    @Get('/buyer')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Get orders by buyer ID' })
    @ApiResponse({ status: 200, description: 'List of orders belonging to the buyer' })
    @ApiResponse({ status: 404, description: 'Buyer not found' })
    async getOrdersByBuyer(@Req() req: Request) {
        const buyerId = req.user.id;
      return this.orderService.getOrdersByBuyer(buyerId);
    }

    @Get('/seller')
    @UseGuards(AuthenticationGuard)
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

    @ApiOperation({
      summary: 'Get Monthly Summary for seller',
      description:
        'Retrieve the total spending by a buyer and total sales by a seller for each month of the current year.',
    })
    @ApiResponse({
      status: 200,
      description: 'The monthly analytics summary.',
      schema: {
        example: {
          totalSales: [500, 700, 1000, 1200, 0, 800, 0, 0, 0, 300, 400, 600],
          totalSpending: [200, 300, 150, 400, 0, 250, 0, 0, 0, 100, 200, 300],
        },
      },
    })
    @ApiResponse({
      status: 400,
      description: 'Bad Request. Invalid userId format.',
    })
    @ApiResponse({
      status: 404,
      description: 'User not found or no data available for the current year.',
    })
    @Get('monthly-summary')
    @UseGuards(AuthenticationGuard)
    async getMonthlySummary(@Req() req: Request) {
      const userId = req.user.id;
      return await this.orderService.getMonthlyAnalytics(userId);
    }
  
    @Get('analytics')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Get order analytics' })
    @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Order analytics not found' })
    async orderAnalytics(@Req() req: Request) {
      const user = req.user.id;
      return this.orderService.syncOrderAnalytics(user);
    }

    @Get('top-products')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({
      summary: 'Get Top 5 Products',
      description: 'Retrieve the top 5 products with the highest sales and number sold.',
    })
    @ApiResponse({
      status: 200,
      description: 'The top 5 products by sales.',
      schema: {
        example: [
          {
            productId: '64e7f40e6f1c4d12345abcde',
            totalSales: 50000,
            totalQuantity: 20,
            productDetails: {
              name: 'Product Name',
              price: 2500,
              category: 'Electronics',
            },
          },
        ],
      },
    })
    @ApiResponse({
      status: 404,
      description: 'No data available.',
    })    
    async getTopProducts() {
      return await this.orderService.getTopProducts();
    }

    @Roles(["admin"])
    @Get('earnings-vs-payouts')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({ summary: 'Get earnings vs payouts vs months analytics' })
@ApiResponse({ status: 200, description: 'Earnings vs Payouts fetched successfully' })
@ApiResponse({ status: 400, description: 'Failed to fetch analytics' })
async getEarningsVsPayouts(): Promise<any> {
  try {
    const analytics = await this.orderService.getEarningsAndPayouts();
    return { success: true, data: analytics };
  } catch (error) {
    throw new BadRequestException('Failed to fetch analytics');
  }
}

    @Roles(["admin"])
    @Get('sales-by-category')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Get sales vs category vs months analytics' })
@ApiResponse({ status: 200, description: 'Sales vs Category fetched successfully' })
@ApiResponse({ status: 400, description: 'Failed to fetch analytics' })
async saleByCategory(): Promise<any> {
  try {
    const analytics = await this.orderService.saleByCategory();
    return { success: true, data: analytics };
  } catch (error) {
    throw new BadRequestException('Failed to fetch analytics');
  }
}

    
    @Get('by-reference/:reference')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Get order details by reference' })
    @ApiParam({
      name: 'reference',
      description: 'The reference ID of the order',
      required: true,
      example: 'REF12345678',
    })
    @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async orderDetailsByReference(
      @Param('reference') reference: string,
      @Req() req: Request
    ) {
      const user = req.user.id;
      return this.orderService.orderDetailsByReference(reference);
    }
  
    @Patch('mark-order-status/:id')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Update the status of an order' })
    @ApiParam({
      name: 'id',
      description: 'The ID of the order to update',
      required: true,
      example: 'ORDER12345',
    })
    @ApiBody({
      description: 'The new status for the order',
      schema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'The new status of the order',
            example: 'confirmed',
          },
        },
      },
    })
    @ApiResponse({ status: 200, description: 'Order status updated successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async markOrderStatus(
      @Param('id') id: string,
      @Body() body: { status: string },
      @Req() req: Request
    ) {
      const user = req.user.id;
      return this.orderService.markOrderStatus(user, id, body.status);
    }
  
    @Get(':orderId')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Get order details by order ID' })
    @ApiParam({
      name: 'orderId',
      description: 'The ID of the order to retrieve',
      required: true,
      example: 'ORDER12345',
    })
    @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrder(
      @Param('orderId') orderId: string,
      @Req() req: Request
    ) {
      const user = req.user.id;
      return this.orderService.getOrderById(user, orderId);
    }  
  
}
