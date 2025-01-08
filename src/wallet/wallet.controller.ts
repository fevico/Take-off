import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Request } from 'express';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { AuthorizationGuard } from 'src/guards/Authorization';
import { Roles } from 'src/decorator/role.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('wallet')
@ApiTags('Wallet')
export class WalletController {

    constructor(private walletService: WalletService ) {}

    @Roles(["admin", "seller"])
    @Get('user-wallet')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({
        summary: 'Get user wallet',
        description: 'Fetches the wallet details of the authenticated user, including balance and transactions.',
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved wallet details',
        schema: {
            type: 'object',
            properties: {
                balance: {
                    type: 'number',
                    example: 150.75,
                    description: 'The current balance of the user wallet.',
                },
                transactions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'txn_12345' },
                            type: { type: 'string', example: 'credit' },
                            amount: { type: 'number', example: 50.0 },
                            date: { type: 'string', format: 'date-time', example: '2024-12-21T10:15:30Z' },
                            description: { type: 'string', example: 'Refund for Order #54321' },
                        },
                    },
                    description: 'Array of transactions associated with the user wallet.',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized. The user is not authenticated or lacks proper permissions.',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden. The user does not have the necessary authorization.',
    })
    async getUserWallet(@Req() req: Request) {
        const userId = req.user.id;
        return this.walletService.getUserWallet(userId);
    }
}
