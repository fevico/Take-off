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
  price: number;
}

export interface populatedUser {
  name: string
  _id: string
  email: string
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

  // async createPayment(body: any, res: any, userId: string) {
  //   const { first_name, last_name, amount, email, metadata } = body;
  //   const { cart, name, note, phone, address, quantity } = metadata;
  
  //   // Extract the necessary fields from cart items
  //   const cartData = cart.map((item: any) => ({
  //     product: item.product,
  //     quantity: item.quantity, 
  //   })); 
  
  //   // 1. Create an order in the database
  //   const newOrder = new this.orderModel({
  //     email,
  //     user: userId,
  //     totalPrice: metadata.totalPrice,
  //     name: metadata.name,
  //     note: metadata.note,
  //     phone: metadata.phone,
  //     address: metadata.address,
  //     cartItems: cartData,
  //   });
  
  //   const savedOrder = await newOrder.save();
  
  //   // Attach the order ID to the metadata
  //   metadata.orderId = savedOrder._id;
  
  //   const params = JSON.stringify({
  //     first_name,
  //     last_name,
  //     amount,
  //     email,
  //     metadata,
  //     callback_url: 'http://localhost:3000/order-recieved',
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
  
  //         if (parsedData.status) {
  //           // Update the order with payment reference
  //           savedOrder.paymentReference = parsedData.data.reference;
  //           await savedOrder.save();
  
  //           console.log("data", data) 
  //           // Respond to the client with Paystack authorization URL and order ID
  //           return res.json({
  //             message: 'Payment initialized successfully',
  //             orderId: savedOrder._id,
  //             data: parsedData.data
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
    const { cart, note, phone, address } = metadata;
  
    // Group cart items by sellerId
    const groupedCart = cart.reduce((acc: any, item: any) => {
      const sellerId = item.product.sellerId; // Assuming product schema includes sellerId
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {});
  
    // Create orders for each seller group
    const orders = [];
    for (const sellerId in groupedCart) {
      const sellerItems = groupedCart[sellerId];
      const totalPrice = sellerItems.reduce((sum: number, item: any) => sum + item.quantity * item.product.price, 0);
  
      // Create individual orders for each seller
      const newOrder = new this.orderModel({
        email,
        buyerId: userId,
        sellerId,
        product: sellerItems[0].product._id, // Each order corresponds to one product
        quantity: sellerItems[0].quantity,
        totalPrice,
        phone,
        address,
        note,
        status: 'pending',
        paymentStatus: 'unpaid',
      });
  
      const savedOrder = await newOrder.save();
      orders.push(savedOrder);
    }
  
    // Attach order IDs to the metadata
    metadata.orderIds = orders.map(order => order._id);
  
    // Prepare Paystack payment initialization parameters
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
  
    // Initialize payment with Paystack
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
            // Update orders with payment reference
            await Promise.all(
              orders.map(order => {
                order.paymentReference = parsedData.data.reference;
                return order.save();
              })
            );
  
            // Respond to the client with Paystack authorization URL and order IDs
            return res.json({
              message: 'Payment initialized successfully',
              orderIds: orders.map(order => order._id),
              data: parsedData.data,
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
  
      if (hash !== paystackSignature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
  
      const event = payload;
      const data = event.data;
  
      if (event.event === 'charge.success') {
        // Update the order based on paymentReference and metadata
        const order = await this.orderModel.findOneAndUpdate(
          { paymentReference: data.reference },
          {
            paidAt: new Date(),
            paymentStatus: 'paid',
            status: 'confirmed', // Update status to confirmed
          },
          { new: true }
        );
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
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
      .populate<{buyerId: populatedUser}>('buyerId', 'name email')
      .populate<{sellerId: populatedUser}>('sellerId', 'name email')
      .populate<{product: populatedProduct}>('product', 'name thumbnail price');
  
    if (!order) {
      throw new Error('Order not found');
    }
  
    // Construct the response object
    return {
      id: order._id,
      orderNumber: order.orderNumber || 'N/A',
      buyer: {
        // id: order.buyerId._id,
        name: order.buyerId.name,
        email: order.buyerId.email,
      },
      seller: {
        id: order.sellerId._id,
        name: order.sellerId.name,
        email: order.sellerId.email,
      },
      product: {
        id: order.product._id,
        name: order.product.name,
        thumbnail: order.product.thumbnail,
        price: order.product.price,
      },
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      address: order.address,
      phone: order.phone || 'N/A',
      note: order.note || 'N/A',
      paymentReference: order.paymentReference || 'N/A',
      paymentStatus: order.paymentStatus,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      paidAt: order.paidAt ? order.paidAt.toISOString().split('T')[0] : 'N/A',
    };
  }
  
  async getOrdersByBuyer(buyerId: string) {
    const orders = await this.orderModel
      .find({ buyerId }) // Filter by buyerId
      .populate<{product: populatedProduct}>('product', 'name thumbnail price') // Populate product details
      .populate<{sellerId: populatedUser}>('sellerId', 'name email'); // Populate seller details
  
    return orders.map((order) => ({
      id: order._id,
      product: {
        id: order.product._id,
        name: order.product.name,
        thumbnail: order.product.thumbnail,
        price: order.product.price,
      },
      seller: {
        id: order.sellerId._id,
        name: order.sellerId.name,
        email: order.sellerId.email,
      },
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      address: order.address,
      phone: order.phone || 'N/A',
      note: order.note || 'N/A',
      paidAt: order.paidAt ? order.paidAt.toISOString().split('T')[0] : 'N/A',
    }));
  }

  async getOrdersBySeller(sellerId: string) {
    const orders = await this.orderModel
      .find({ sellerId }) // Filter by sellerId
      .populate<{product: populatedProduct}>('product', 'name thumbnail price') // Populate product details
      .populate<{buyerId: populatedUser}>('buyerId', 'name email'); // Populate buyer details
  
    return orders.map((order) => ({
      id: order._id,
      product: {
        id: order.product._id,
        name: order.product.name,
        thumbnail: order.product.thumbnail,
        price: order.product.price,
      },
      buyer: {
        id: order.buyerId._id,
        name: order.buyerId.name,
        email: order.buyerId.email,
      },
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      address: order.address,
      phone: order.phone || 'N/A',
      note: order.note || 'N/A',
      paidAt: order.paidAt ? order.paidAt.toISOString().split('T')[0] : 'N/A',
    }));
  }
  

async orderDetailsBySeller(user: string){

}
   
}
