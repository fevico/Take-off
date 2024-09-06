import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from 'src/auth/schema/seller.schema';

@Injectable()
export class SellerService {

    // constructor(@InjectModel (Seller.name) private readonly sellerModel:Model<Seller>){}
    // async becomeSeller(body){}
}
