import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from './schema/wallet';
import { Model } from 'mongoose';

@Injectable()
export class WalletService {
    constructor(@InjectModel(Wallet.name) private readonly walletModel:Model<Wallet>) {}

    async getUserWallet(userId: string) {
        const wallet = await this.walletModel.findOne({owner:userId});
        if(!wallet) throw new NotFoundException("No wallet found for this user!")
            return {wallet : wallet.balance};
    }

    async getTransactions(userId: string) {
        const wallet = await this.walletModel.findOne({owner:userId});
        if(!wallet) throw new NotFoundException("No wallet found for this user!")
            return {transactions : wallet.transactions};
    }
}
