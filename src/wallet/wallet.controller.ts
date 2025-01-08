import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Request } from 'express';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { AuthorizationGuard } from 'src/guards/Authorization';
import { Roles } from 'src/decorator/role.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('wallet')
@ApiTags('Wallet')
export class WalletController {

    constructor(private walletService: WalletService ) {}

    @Roles(["admin", "seller"])
    @Get('user-wallet')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    async getUserWallet(@Req() req: Request) {
        const userId = req.user.id;
        return this.walletService.getUserWallet(userId);
    }
}
