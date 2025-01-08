import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types, Document } from "mongoose";

@Schema({ timestamps: true })
export class Wallet extends Document {
    @Prop({ type: MongooseSchema.Types.Decimal128, default: 0 })
    balance: MongooseSchema.Types.Decimal128;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    owner: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.Decimal128, default: 0 })
    totalSales: MongooseSchema.Types.Decimal128;

    @Prop({ type: MongooseSchema.Types.Decimal128, default: 0 })
    rollOut: MongooseSchema.Types.Decimal128;

    @Prop({
        type: [
            {
                amount: { type: MongooseSchema.Types.Decimal128, required: true },
                totalAmount: { type: MongooseSchema.Types.Decimal128, default: 0 },
                date: { type: Date, default: Date.now },
                type: { type: String, enum: ['credit', 'debit', 'refund'], required: true },
                source: { type: String, default: 'unknown' },
                status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
            },
        ],
        default: [],
    })
    transactions: {
        amount: Types.Decimal128;
        totalAmount: Types.Decimal128;
        date: Date;
        type: 'credit' | 'debit' | 'refund';
        source?: string;
        status: 'pending' | 'completed' | 'failed';
    }[];
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
