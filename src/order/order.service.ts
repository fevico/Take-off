import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';

const secret = process.env.PAYSTACK_SECRET_KEY;

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async createPayment(body: any, res: any) {
    const { amount, email, metadata } = body;

    const params = JSON.stringify({
      amount,
      email,
      metadata,
      callback_url: 'http://localhost:5173/',
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    };

    const reqPaystack = https
      .request(options, (respaystack) => {
        let data = '';

        respaystack.on('data', (chunk) => {
          data += chunk;
        });

        respaystack.on('end', () => {
          console.log(JSON.parse(data));
          // Assuming res is the response object from the caller context
          res.send(data);
          console.log(data);
        });
      })
      .on('error', (error) => {
        console.error(error);
      });

    reqPaystack.write(params);
    reqPaystack.end();
  }

  async webhook(body: any, res: any, req: Request) {
    // Verify the event is coming from Paystack
    try {
        const payload = await req.json(); // Parse the request body as JSON
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (hash == req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = payload;
        // Do something with event
        const data = event.data;

        if (event.event === 'charge.success') {
          const cardLast4 = data.authorization.last4; // Last 4 digits of the card
          const cardType = data.authorization.brand; // Card type (e.g., Visa, Mastercard)
          const accountName = data.authorization.account_name;
          const cardBank = data.authorization.bank;
          // Step 3: Find the order using Paystack reference

          const order = await this.orderModel.findOne({
            reference: data.paymentReference,
          });

          if (order) {
            // Step 4: Update order payment status and delivery status
            await this.orderModel.findByIdAndUpdate(order.id, {
              isPaid: true,
              paidAt: new Date(),
              paymentStatus: 'SUCCESS',
            //   cardType: cardType,
            //   cardLast4: cardLast4,
            //   cardAccountName: accountName,
            //   cardBank: cardBank,
            });

            const cardDetails = {
              cardLast4,
              cardType,
              cardAccountName: accountName,
              cardBank,
            };
            return res.json(
              { message: 'Payment successful and email sent' },
              { status: 200 },
            );
          } else {
            return res.json({ message: 'Order not found' });
          }
        }
      }
    } catch (error) {
        return res.json({ message: 'Payment failed', error });
    }
  }
}
