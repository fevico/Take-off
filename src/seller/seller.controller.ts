import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BecomeSellerDto } from './dto/seller.dto';

@Controller('seller')
@ApiTags('Seller')
export class SellerController {
  constructor(private sellerService: SellerService) {}

  @Post('become-seller')
  // @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Request seller account verification' })
  @ApiBody({
    description: 'Email of the user requesting to become a seller',
    type: BecomeSellerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Verification token sent to your email',
    schema: {
      example: {
        message: 'Verification token sent to your email',
        token: 'generatedToken12345',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async becomeSeller(@Body() body: BecomeSellerDto) {
    return this.sellerService.becomeSeller(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register as a seller' })
  @ApiBody({
    description: 'Email of the user requesting to become a seller',
    type: BecomeSellerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Seller account created successfully',
    schema: {
      example: {
        message: 'Seller account created successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async register(@Body() body: BecomeSellerDto) {
    // return this.sellerService.register(body);
  }
}
