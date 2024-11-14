import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { Request } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('cart')
@ApiTags("Cart")
export class CartController {
    constructor(private cartService: CartService) {}

    @Post('add')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Add or update items in the cart' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string', description: 'Product ID' },
                quantity: { type: 'integer', description: 'Quantity of the product' },
              },
              required: ['product', 'quantity'],
            },
          },
        },
      },
    })
    @ApiResponse({ status: 200, description: 'Cart updated successfully' })
    async updateCart(
      @Body() body: { items: Array<{ product: string, quantity: number }> },
      @Req() req: Request
    ) {
      const user = req.userId;
      return this.cartService.updateCart(body, user);
    }
  
    @Get('get')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Retrieve the user’s cart' })
    @ApiResponse({ status: 200, description: 'User cart retrieved successfully' })
    async getCart(@Req() req: Request) {
      const user = req.userId;
      return this.cartService.getCart(user);
    }
  
    @Post('clear')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ summary: 'Clear the user’s cart' })
    @ApiResponse({ status: 200, description: 'User cart cleared successfully' })
    async clearCart(@Req() req: Request) {
      const user = req.userId;
      return this.cartService.clearCart(user);
    }
  
}
