import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { AuthenticationGuard } from 'src/guards/Authentication';

@Controller('seller')
export class SellerController {

    constructor(private sellerService: SellerService) {}

    // @Post('become-seller')
    // @UseGuards(AuthenticationGuard)
    // // becomeSeller(@Body() body: any){
    // //     return this.sellerService.becomeSeller(body)
    // }
}
