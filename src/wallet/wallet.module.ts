import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schema/wallet';

@Module({
  imports: [MongooseModule.forFeature([    
      { name: Wallet.name, schema: WalletSchema },
  ])],
  providers: [WalletService],
  controllers: [WalletController]
})
export class WalletModule {}
