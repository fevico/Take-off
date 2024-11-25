import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();


const secret = process.env.PAYSTACK_SECRET_KEY;

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async createPayment(body: any, res: any, userId: string) {
    const { amount, email, metadata } = body;
  
    // 1. Create an order in the database
    const newOrder = new this.orderModel({
      email,
      user: userId,
      price: metadata.price,
      quantity: metadata.quantity,
      address: metadata.address,
      productId: metadata.productId,
      paymentStatus: 'pending', // Initial payment status
    });
  
    const savedOrder = await newOrder.save();
  
    // Attach the order ID to the metadata
    metadata.orderId = savedOrder._id;
  
    const params = JSON.stringify({
      amount,
      email,
      metadata,
      callback_url: 'http://localhost:5173/', // Update to your frontend callback URL
    });
  
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Ensure your Paystack secret key is properly set in the .env file
        'Content-Type': 'application/json',
      },
    };
  
    // 2. Initialize payment with Paystack
    const reqPaystack = https.request(options, async (respaystack) => {
      let data = '';
  
      // Collect response data
      respaystack.on('data', (chunk) => {
        data += chunk;
      });
  
      respaystack.on('end', async () => {
        try {
          const parsedData = JSON.parse(data);
  
          if (parsedData.status) {
            // Update the order with payment reference
            savedOrder.paymentReference = parsedData.data.reference;
            await savedOrder.save();
  
            // Respond to the client with Paystack authorization URL and order ID
            return res.json({
              message: 'Payment initialized successfully',
              authorization_url: parsedData.data.authorization_url,
              orderId: savedOrder._id,
            });
          } else {
            // Handle failure to initialize payment
            console.error('Payment initialization failed:', parsedData.message);
            return res.status(400).json({
              message: 'Failed to initialize payment',
              error: parsedData.message,
            });
          }
        } catch (error) {
          console.error('Error processing payment initialization response:', error);
          return res.status(500).json({ message: 'Error processing payment initialization response' });
        }
      });
    });
  
    // Handle errors during the HTTP request
    reqPaystack.on('error', (error) => {
      console.error('Error with Paystack request:', error);
      return res.status(500).json({ message: 'Internal Server Error', error });
    });
  
    // Write the request parameters and end the request
    reqPaystack.write(params);
    reqPaystack.end();
  }
  

//   async createPayment(body: any, res: any) {
//     const { amount, email, metadata, orderDetails } = body;
  
//     // 1. Create an order in the database
//     const newOrder = new this.orderModel({
//       amount,
//       email,
//       metadata, // Additional order details
//       status: 'pending', // Initial status
//       createdAt: new Date(),
//     });
  
//     const savedOrder = await newOrder.save();
  
//     // Attach the order ID or reference to the metadata
//     metadata.orderId = savedOrder._id;
  
//     const params = JSON.stringify({
//       amount,
//       email,
//       metadata,
//       callback_url: 'http://localhost:5173/', // Add your frontend callback URL
//     });
  
//     const options = {
//       hostname: 'api.paystack.co',
//       port: 443,
//       path: '/transaction/initialize',
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`, // Ensure your secret key is set in the .env file
//         'Content-Type': 'application/json',
//       },
//     };
  
//     const reqPaystack = https
//       .request(options, (respaystack) => {
//         let data = '';
  
//         respaystack.on('data', (chunk) => {
//           data += chunk;
//         });
  
//         respaystack.on('end', () => {
//           const parsedData = JSON.parse(data);
  
//           if (parsedData.status) {
//             // Add Paystack authorization URL to the response
//             res.json({
//               message: 'Payment initialized successfully',
//               authorization_url: parsedData.data.authorization_url,
//               orderId: savedOrder._id,
//             });
//           } else {
//             res.status(400).json({
//               message: 'Failed to initialize payment',
//               error: parsedData.message,
//             });
//           }
//         });
//       })
//       .on('error', (error) => {
//         console.error(error);
//         res.status(500).json({
//           message: 'Internal Server Error',
//           error,
//         });
//       });
  
//     reqPaystack.write(params);
//     reqPaystack.end();
//   }
  

  async webhook( res: any, req: Request) {
    // Verify the event is coming from Paystack
    try {
        const payload = await req.json(); // Parse the request body as JSON
        console.log("payload data", payload.events.data)
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Invalid signature');
        return res.status(200).send(); // Acknowledge event to stop retries
      }

        // Retrieve the request's body
        const event = payload;
        // Do something with event
        const data = event.data;
        console.log("event is working", event)
        if (event.event === 'charge.success') {
            console.log(event)
          const cardLast4 = data.authorization.last4; // Last 4 digits of the card
          const cardType = data.authorization.brand; // Card type (e.g., Visa, Mastercard)
          const accountName = data.authorization.account_name;
          const cardBank = data.authorization.bank;
        //   // Step 3: Find the order using Paystack reference

          const order = await this.orderModel.findOne({paymentReference: data.reference});
          console.log(order)

          if (order) {
            // Step 4: Update order payment status and delivery status
            await this.orderModel.findByIdAndUpdate(order._id, {
              paidAt: new Date(),
              paymentStatus: 'SUCCESS',
              paymentReference: data.reference,
            //   cardType: cardType,
            //   cardLast4: cardLast4,
            //   cardAccountName: accountName,
            //   cardBank: cardBank,
            });
            console.log("payment successful", data)

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
              if (event.event === 'charge.success') {
        const data = event.data;
        console.log('Payment successful:', data);
  
        // Update order status or perform necessary actions
        // Example: Update order in database
      }
    } catch (error) {
         return { message: 'Payment failed', error };
    }
  }


//   async webhook(req: any, res: any) {
//     try {
//       // Retrieve and validate the signature
//       const secret = process.env.PAYSTACK_SECRET_KEY;
//       const hash = crypto 
//         .createHmac('sha512', secret)
//         .update(req.rawBody) // Use raw body
//         .digest('hex');
      
//       if (hash !== req.headers['x-paystack-signature']) {
//         console.warn('Invalid signature');
//         return res.status(200).send(); // Acknowledge event to stop retries
//       }
  
//       // Parse and process the event
//       const event = JSON.parse(req.rawBody); // Use raw body if not already parsed
//       console.log('Received event:', event);
  
//       if (event.event === 'charge.success') {
//         const data = event.data;
//         console.log('Payment successful:', data);
  
//         // Update order status or perform necessary actions
//         // Example: Update order in database
//       }
  
//       res.status(200).send(); // Always acknowledge the event
//     } catch (error) {
//       console.error('Webhook error:', error);
//       res.status(200).send(); // Acknowledge the event to prevent retries
//     }
//   }
  
}
