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

  // async createPayment(body: any, res: any, userId: string) {
  //   const {first_name, last_name, amount, email, metadata } = body;
  //   const {cart, name, note, phone, address} = metadata
  
  //   const cartData = cart.cartItems.map((item: any) => ({
  //     id: item?.id,
  //     name: item.name,
  //     category: item.categoryId,
  //     price: item.price,
  //     image: item.thumbnail,
  //     quantity: item.cartQuantity,
  //     product: item._id,
  // }));

  //   // 1. Create an order in the database
  //   const newOrder = new this.orderModel({
  //     email,
  //     user: userId,
  //     price: metadata.price,
  //     name: metadata.name,
  //     note: metadata.note,
  //     phone: metadata.phone,
  //     address: metadata.address,
  //     cart: metadata.cart,
  //     productId: cartData.map((item: any) => item.product),
  //     paymentStatus: 'pending', // Initial payment status
  //   });
  
  //   const savedOrder = await newOrder.save();
  
  //   // Attach the order ID to the metadata
  //   metadata.orderId = savedOrder._id;
  
  //   const params = JSON.stringify({
  //     amount,
  //     email,
  //     metadata,
  //     callback_url: 'http://localhost:5173/', // Update to your frontend callback URL
  //   });
  
  //   const options = {
  //     hostname: 'api.paystack.co',
  //     port: 443,
  //     path: '/transaction/initialize',
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Ensure your Paystack secret key is properly set in the .env file
  //       'Content-Type': 'application/json',
  //     },
  //   };
  
  //   // 2. Initialize payment with Paystack
  //   const reqPaystack = https.request(options, async (respaystack) => {
  //     let data = '';
  
  //     // Collect response data
  //     respaystack.on('data', (chunk) => {
  //       data += chunk;
  //     });
  
  //     respaystack.on('end', async () => {
  //       try {
  //         const parsedData = JSON.parse(data);
  //         console.log(data)
  
  //         if (parsedData.status) {
  //           // Update the order with payment reference
  //           savedOrder.paymentReference = parsedData.data.reference;
  //           await savedOrder.save();
  
  //           // Respond to the client with Paystack authorization URL and order ID
  //           return res.json({
  //             message: 'Payment initialized successfully',
  //             authorization_url: parsedData.data.authorization_url,
  //             orderId: savedOrder._id,
  //           });
  //         } else {
  //           // Handle failure to initialize payment
  //           console.error('Payment initialization failed:', parsedData.message);
  //           return res.status(400).json({
  //             message: 'Failed to initialize payment',
  //             error: parsedData.message,
  //           });
  //         }
  //       } catch (error) {
  //         console.error('Error processing payment initialization response:', error);
  //         return res.status(500).json({ message: 'Error processing payment initialization response' });
  //       }
  //     });
  //   });
  
  //   // Handle errors during the HTTP request
  //   reqPaystack.on('error', (error) => {
  //     console.error('Error with Paystack request:', error);
  //     return res.status(500).json({ message: 'Internal Server Error', error });
  //   });
  
  //   // Write the request parameters and end the request
  //   reqPaystack.write(params);
  //   reqPaystack.end();
  // }

  async createPayment(body: any, res: any, userId: string) {
    const { first_name, last_name, amount, email, metadata } = body;
    const { cart, name, note, phone, address, quantity } = metadata;
  
    // Extract the necessary fields from cart items
    const cartData = cart.map((item: any) => ({
      productId: item._id, // Extract the product ID
      quantity: item.cartQuantity,
      image: item.thumbnail,
    }));
  
    // 1. Create an order in the database
    const newOrder = new this.orderModel({
      email,
      user: userId,
      price: metadata.price,
      name: metadata.name,
      note: metadata.note,
      phone: metadata.phone,
      address: metadata.address,
      cart: cartData,
      product: cartData.map((item: any) => item.productId),
      paymentStatus: 'pending'
    });
  
    const savedOrder = await newOrder.save();
  
    // Attach the order ID to the metadata
    metadata.orderId = savedOrder._id;
  
    const params = JSON.stringify({
      first_name,
      last_name,
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
  
  

//   async webhook( res: any, req: Request) {
//     // Verify the event is coming from Paystack
//     try {
//         const payload = await req.json(); // Parse the request body as JSON
//         console.log("payload data", payload)
//       const hash = crypto
//         .createHmac('sha512', secret)
//         .update(JSON.stringify(payload))
//         .digest('hex');
//         if (hash !== req.headers['x-paystack-signature']) {
//         console.warn('Invalid signature');
//         return res.status(200).send(); // Acknowledge event to stop retries
//       }

//         // Retrieve the request's body
//         const event = payload;
//         // Do something with event
//         const data = event.data;
//         console.log("event is working", event)
//         if (event.event === 'charge.success') {
//             console.log(event)
//           const cardLast4 = data.authorization.last4; // Last 4 digits of the card
//           const cardType = data.authorization.brand; // Card type (e.g., Visa, Mastercard)
//           const accountName = data.authorization.account_name;
//           const cardBank = data.authorization.bank;
//         //   // Step 3: Find the order using Paystack reference

//           const order = await this.orderModel.findOne({paymentReference: data.reference});
//           console.log(order)

//           if (order) {
//             // Step 4: Update order payment status and delivery status
//             await this.orderModel.findByIdAndUpdate(order._id, {
//               paidAt: new Date(),
//               paymentStatus: 'SUCCESS',
//               paymentReference: data.reference,
//             //   cardType: cardType,
//             //   cardLast4: cardLast4,
//             //   cardAccountName: accountName,
//             //   cardBank: cardBank,
//             });
//             console.log("payment successful", data)

//             const cardDetails = {
//               cardLast4,
//               cardType,
//               cardAccountName: accountName,
//               cardBank,
//             };
//             return res.json(
//               { message: 'Payment successful and email sent' },
//               { status: 200 },
//             );
//           } else {
//             return res.json({ message: 'Order not found' });
//           }
//         }
//               if (event.event === 'charge.success') {
//         const data = event.data;
//         console.log('Payment successful:', data);
  
//         // Update order status or perform necessary actions
//         // Example: Update order in database
//       }
//     } catch (error) {
//          return { message: 'Payment failed', error };
//     }
//   }

//   async webhook(req: Request, res: any) {
//     try {
//       // Parse raw JSON payload
//       const payload = req.body;
  
//       // Verify signature
//       const hash = crypto
//         .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
//         .update(JSON.stringify(payload))
//         .digest('hex');
  
//       if (hash !== req.headers['x-paystack-signature']) {
//         console.warn('Invalid signature');
//         return res.status(200).send(); // Acknowledge event to stop retries
//       }
  
//       // Handle event
//       const event = payload;
//       if (event.event === 'charge.success') {
//         const data = event.data;
  
//         // Find order by payment reference
//         const order = await this.orderModel.findOne({ paymentReference: data.reference });
//         if (order && order.paymentStatus !== 'SUCCESS') {
//           // Update order status
//           await this.orderModel.findByIdAndUpdate(order._id, {
//             paidAt: new Date(),
//             paymentStatus: 'SUCCESS',
//             paymentReference: data.reference,
//           });
  
//           console.log('Payment successful:', data);
  
//           // Optionally, process card details
//           const cardDetails = {
//             cardLast4: data.authorization?.last4,
//             cardType: data.authorization?.brand,
//             cardBank: data.authorization?.bank,
//           };
  
//           return res.status(200).send();
//         } else if (!order) {
//           console.error('Order not found for reference:', data.reference);
//         }
//       }
//       return res.status(200).send(); // Always acknowledge webhook
//     } catch (error) {
//       console.error('Webhook error:', error);
//       return res.status(200).send(); // Always acknowledge to stop retries
//     }
//   }

async webhook(req: any, res: any) {
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
    // Retrieve the request's body
    console.log(req.body)
    const event = req.body;
    // Do something with event  
          if (event.event === 'charge.success') {
        const data = event.data;
        console.log(hash)
  
        // Find order by payment reference
        const order = await this.orderModel.findOne({ paymentReference: data.reference });
        console.log(order)
        if (order && order.paymentStatus !== 'SUCCESS') {
          // Update order status
          await this.orderModel.findByIdAndUpdate(order._id, {
            paidAt: new Date(),
            paymentStatus: 'SUCCESS',
            paymentReference: data.reference,
          });
  
          console.log('Payment successful:', data);
          
    }
    res.send(200);
          }
}
}
   
}
