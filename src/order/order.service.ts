import { Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { User } from 'src/auth/schema/auth.schema';
dotenv.config();


export interface populatedProduct {
  name: string
  _id: Types.ObjectId;
  thumbnail: string;
}

export interface populatedUser {
  name: string
  _id: string
}
type Product = {
  _id: string;
  name: string;
  thumbnail: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
) {}

  async createPayment(body: any, res: any, userId: string) {
    const { first_name, last_name, amount, email, metadata } = body;
    const { cart, name, note, phone, address, quantity } = metadata;
  
    // Extract the necessary fields from cart items
    const cartData = cart.map((item: any) => ({
      product: item.product,
      quantity: item.quantity, 
    })); 
  
    // 1. Create an order in the database
    const newOrder = new this.orderModel({
      email,
      user: userId,
      totalPrice: metadata.totalPrice,
      name: metadata.name,
      note: metadata.note,
      phone: metadata.phone,
      address: metadata.address,
      cartItems: cartData,
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
      callback_url: 'http://localhost:3000/order-recieved',
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
  
            console.log("data", data) 
            // Respond to the client with Paystack authorization URL and order ID
            return res.json({
              message: 'Payment initialized successfully',
              orderId: savedOrder._id,
              data: parsedData.data
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

async webhook(req: any, res: any) {
  try {
    const payload = req.body;
    const paystackSignature = req.headers['x-paystack-signature'];
    if (!paystackSignature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest('hex');

      console.log(hash)
    if (hash !== paystackSignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = payload;
    const data = event.data;

    if (event.event === 'charge.success') {
      const order = await this.orderModel.findOneAndUpdate(
        { paymentReference: data.reference, _id: data.metadata?.orderId },
        {
          paidAt: new Date().toISOString().split('T')[0],
          paymentStatus: 'paid',
        },
        { new: true } // Ensure updated document is returned
      );

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Retrieve the user associated with the order
      const user = await this.userModel.findById(order.user);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Extract product IDs from cartItems
      const productIds = order.cartItems.map((item) => item.product.toString());

      // Add product IDs to the user's products array without duplicates
      user.products = Array.from(
        new Set([
          ...user.products.map((id) => new Types.ObjectId(id)), // Ensure existing IDs are ObjectId
          ...productIds.map((id) => new Types.ObjectId(id)),   // Convert productIds to ObjectId
        ])
      );
      await user.save();

      return res.status(200).json({ message: 'Payment processed successfully' });
    } else if (event.event === 'charge.failed') {
      console.error('Payment failed:', data);
      return res.status(400).json({ message: 'Payment failed' });
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


async orderDetailsByReference(reference: string) {
  const order = await this.orderModel
    .findOne({ paymentReference: reference })
    .populate<{ user: populatedUser }>({
      path: 'user', 
      select: 'name',
    })
    .populate<{ "cartItems.product": populatedProduct }>("cartItems.product")

    const productDetails = order.cartItems.map((item: any) => ({
      id: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      thumbnail: item.product.thumbnail,
      totalPrice: item.totalPrice 
    }));

    // Construct the response object
    return {
      id: order._id,
      user: order.user.name || "No Name",
      email: order.email,
      address: order.address,
      paymentReference: order.paymentReference,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      price: order.totalPrice,
      paidAt: order.paidAt.toISOString().split("T")[0],
      cartItems: productDetails,
    };
  }


async orderDetailsBySeller(user: string){

}
   
}
