import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schema/payment.schema';
import * as https from 'https';


@Injectable()
export class PaymentService {
    constructor( @InjectModel(Payment.name) private paymentModel: Model<Payment>){}

    async createPayment(body: any, res: any){
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
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
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
              console.log(data)
            });
          })
          .on('error', (error) => {
            console.error(error);
          });
    
        reqPaystack.write(params);
        reqPaystack.end();

    }

    async verifyPayment(reference: string, res: any) {
        const options = {
          hostname: 'api.paystack.co',
          port: 443,
          path: `/transaction/verify/${reference}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        };
    
        const reqPaystack = https.request(options, (respaystack) => {
          let data = '';
    
          respaystack.on('data', (chunk) => {
            data += chunk;
          });
    
          respaystack.on('end', async () => {
            try {
              const responseData = JSON.parse(data);
    
              // Log the entire response from Paystack for debugging
    
              if (
                responseData.status === true
              ){
                // Payment was successful, you can process the payment here
                res.status(200).json({ status: true, message: 'Payment verified successfully.' });
              }
                
            } catch (error) {
              console.error('Error parsing response:', error);
              return res.status(500).json({ status: false, message: 'Server error.' });
            }
          });
        });
    
        reqPaystack.on('error', (error) => {
          console.error('Error with Paystack request:', error);
          res.status(500).json({ status: false, message: 'Server error.' });
        });
    
        reqPaystack.end();
      }
}
