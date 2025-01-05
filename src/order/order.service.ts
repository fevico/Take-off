import {
  Injectable,
  NotFoundException,
  Type,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { User } from 'src/auth/schema/auth.schema';
import { generateOrderNumber } from 'src/utils/token';
dotenv.config();

export interface populatedProduct {
  name: string;
  _id: Types.ObjectId;
  thumbnail: string;
  price: number;
}

export interface populatedUser {
  name: string;
  _id: string;
  email: string;
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

      // Create individual orders for each product in the seller's group
      for (const item of sellerItems) {
        const { product, quantity } = item;
        const totalPrice = quantity * product.price;

        // Create an individual order for the product
        const orderNumber = generateOrderNumber()
        const newOrder = new this.orderModel({
          email,
          buyerId: userId,
          sellerId,
          product: product._id,
          quantity,
          totalPrice,
          phone,
          address,
          note,
          orderNumber,
          status: 'pending',
          paymentStatus: 'unpaid',
        });

        const savedOrder = await newOrder.save();
        orders.push(savedOrder);
      }
    }

    // Attach order IDs to the metadata
    metadata.orderIds = orders.map((order) => order._id);

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

    const reqPaystack = https.request(options, async (respaystack) => {
      let data = '';

      respaystack.on('data', (chunk) => {
        data += chunk;
      });

      respaystack.on('end', async () => {
        try {
          const parsedData = JSON.parse(data);

          if (parsedData.status) {
            // Update all orders with the same payment reference
            await Promise.all(
              orders.map((order) => {
                order.paymentReference = parsedData.data.reference;
                return order.save();
              }),
            );

            return res.json({
              message: 'Payment initialized successfully',
              orderIds: orders.map((order) => order._id),
              data: parsedData.data,
            });
          } else {
            console.error('Payment initialization failed:', parsedData.message);
            return res.status(400).json({
              message: 'Failed to initialize payment',
              error: parsedData.message,
            });
          }
        } catch (error) {
          console.error(
            'Error processing payment initialization response:',
            error,
          );
          return res
            .status(500)
            .json({
              message: 'Error processing payment initialization response',
            });
        }
      });
    });

    reqPaystack.on('error', (error) => {
      console.error('Error with Paystack request:', error);
      return res.status(500).json({ message: 'Internal Server Error', error });
    });

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

      console.log(hash);
      if (hash !== paystackSignature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const event = payload;
      const data = event.data;

      if (event.event === 'charge.success') {
        // Find all orders with the same paymentReference
        const orders = await this.orderModel.find({
          paymentReference: data.reference,
        });

        if (!orders.length) {
          return res.status(404).json({ message: 'Orders not found' });
        }

        // Update payment details and order status for each order
        const productIds = [];
        for (const order of orders) {
          order.paidAt = new Date();
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          await order.save();

          if (order.product) {
            // Accumulate product IDs (single or multiple)
            if (Array.isArray(order.product)) {
              productIds.push(...order.product);
            } else {
              productIds.push(order.product);
            }
          }
        }

        // Add the products to the user's purchasedProducts field
        await this.userModel.findByIdAndUpdate(
          orders[0].buyerId, // Assuming all orders have the same buyerId for a given reference
          {
            $addToSet: { products: { $each: productIds } }, // Add unique products
          },
          { new: true },
        );

        return res
          .status(200)
          .json({ message: 'Payment processed successfully' });
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
    const orders = await this.orderModel
      .find({ paymentReference: reference }) // Use find() to fetch all matching orders
      .populate<{ buyerId: populatedUser }>('buyerId', 'name email')
      .populate<{ sellerId: populatedUser }>('sellerId', 'name email')
      .populate<{ product: populatedProduct }>(
        'product',
        'name thumbnail price',
      );

    if (!orders.length) {
      throw new Error('No orders found with the given reference');
    }

    // Construct the response for multiple orders
    return orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber || 'N/A',
      buyer: {
        name: order.buyerId.name || 'N/A',
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
      paidAt: order.paidAt ? order.paidAt : 'N/A',
    }));
  }

  async getOrdersByBuyer(buyerId: string) {
    const orders = await this.orderModel
      .find({ buyerId }) // Filter by buyerId
      .populate<{ product: populatedProduct }>(
        'product',
        'name thumbnail price',
      ) // Populate product details
      .populate<{ sellerId: populatedUser }>('sellerId', 'name email'); // Populate seller details

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
      paidAt: order.paidAt ? order.paidAt : 'N/A',
    }));
  }

    async getOrderById(user: string, orderId: string) {
      const orders = await this.orderModel
        .findOne({
          _id: orderId,
          $or: [{ buyerId: user }, { sellerId: user }],
        })
        .populate<{product: populatedProduct }>('product', 'name thumbnail price') // Populate product details
        .populate<{ sellerId: populatedUser }>('sellerId', 'name email') // Populate seller details
        .populate<{buyerId: populatedUser}>('buyerId', 'name email'); // Populate buyer details
  
      if (!orders) {
        throw new NotFoundException({ error: 'Order not found' });
      }
  
      // Safely map populated fields to the response format
      return {
        id: orders._id,
        product: {
          id: orders.product?._id || null, // Safely access optional fields
          name: orders.product?.name || 'N/A',
          thumbnail: orders.product?.thumbnail || 'N/A',
          price: orders.product?.price || 0,
        },
        seller: {
          id: orders.sellerId?._id || null,
          name: orders.sellerId?.name || 'N/A',
          email: orders.sellerId?.email || 'N/A',
        },
        buyer: {
          id: orders.buyerId?._id || null,
          name: orders.buyerId?.name || 'N/A',
          email: orders.buyerId?.email || 'N/A',
        },
        quantity: orders.quantity || 0,
        totalPrice: orders.totalPrice || 0,
        status: orders.status || 'unknown',
        paymentStatus: orders.paymentStatus || 'unknown',
        deliveryStatus: orders.deliveryStatus || 'unknown',
        address: orders.address || 'N/A',
        phone: orders.phone || 'N/A',
        note: orders.note || 'N/A',
        paidAt: orders.paidAt ? orders.paidAt : 'N/A',
      };
    }
  
  async getOrdersBySeller(sellerId: string) {
    const orders = await this.orderModel
      .find({ sellerId }) // Filter by sellerId
      .populate<{ product: populatedProduct }>(
        'product',
        'name thumbnail price',
      ) // Populate product details
      .populate<{ buyerId: populatedUser }>('buyerId', 'name email'); // Populate buyer details

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
      paidAt: order.paidAt ? order.paidAt : 'N/A',
    }));
  }

  async markOrderStatus(user: string, orderId: string, action: string) {

    const findOwnerOrder = await this.orderModel.findOne({
      _id: orderId,
      $or: [{ buyerId: user }, { sellerId: user }],
    });
    if (!findOwnerOrder) {
      throw new UnauthorizedException({
        error: 'You are not authorized to perform this action',
      });
    }

    // Fetch the order
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException({ error: 'Order not found' });
    }

    // Handle actions
    switch (action) {
      case 'accept':
        if (order.status !== 'pending') {
          throw new UnprocessableEntityException({
            error: 'Order cannot be accepted',
          });
        }
        order.status = 'confirmed';
        order.deliveryStatus = 'pending';
        break;

      case 'reject':
        if (order.status !== 'pending') {
          throw new UnprocessableEntityException({
            error: 'Order cannot be rejected',
          });
        }
        order.status = 'cancelled';
        order.deliveryStatus = 'cancelled';
        break;

      case 'ship':
        if (
          order.status !== 'confirmed' ||
          order.deliveryStatus !== 'pending'
        ) {
          throw new UnprocessableEntityException({
            error: 'Order cannot be shipped',
          });
        }
        order.deliveryStatus = 'shipped';
        order.shippedDate = new Date();
        break;

      case 'deliver':
        if (order.deliveryStatus !== 'shipped') {
          throw new UnprocessableEntityException({
            error: 'Order cannot be delivered',
          });
        }
        order.deliveryStatus = 'delivered';
        order.deliveredDate = new Date();
        break;

      case 'receive':
        if (order.deliveryStatus !== 'delivered') {
          throw new UnprocessableEntityException({
            error: 'Order cannot be received',
          });
        }
        order.deliveryStatus = 'accepted';
        order.receivedDate = new Date();
        break;

      default:
        throw new UnprocessableEntityException({ error: 'Invalid action' });
    }

    // Save updates
    await order.save();
    return { statusCode: 200, message: 'Order updated successfully', order };
  }
}
