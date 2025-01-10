import {
  Injectable,
  NotFoundException,
  Type,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, ObjectId, Types } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { User } from 'src/auth/schema/auth.schema';
import { generateOrderNumber } from 'src/utils/token';
import { Wallet } from 'src/wallet/schema/wallet';
import { Product } from 'src/product/schema/product.schema';
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
type Products = {
  _id: string;
  name: string;
  thumbnail: string;
};

interface Transaction {
  amount: number;
  date: Date;
}

interface SellerTransaction {
  amount: number;
  transactions: Transaction[];
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Product.name) private productModel: Model<Products>,
  ) { }

  async createPayment(body: any, res: any, req: any, userId: string) {
    const { first_name, last_name, amount, email, metadata } = body;
    const { cart, note, phone, address, name } = metadata;

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
          name,
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
      // callback_url: 'http://localhost:3000/order-recieved',
      callback_url: `${req.headers.origin}/order-recieved`,
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
  
        console.log(hash)
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
  
        const productIds = [];
        // const sellerTransactions = {}; // Group transactions by sellerId
        const sellerTransactions = new Map<ObjectId, SellerTransaction>();
  
        for (const order of orders) {
          order.paidAt = new Date();
          order.paymentStatus = 'paid';
          await order.save();
  
          if (order.product) {
            productIds.push(order.product);
          }
  
          // Group transactions by sellerId
          const sellerId = order.sellerId.toString();

          if (!sellerTransactions[sellerId]) {
            sellerTransactions[sellerId] = {
              amount: 0,
              transactions: [],
            };
          }
  
          const totalPrice = order.totalPrice;
          const eightyPercent = totalPrice * 0.8;
          const twentyPercent = totalPrice * 0.2;

          sellerTransactions[sellerId].amount += eightyPercent;
          sellerTransactions[sellerId].transactions.push({
            amount: totalPrice,
            totalAmount: totalPrice, // Adjust if needed
            date: new Date(),
            type: "credit"
          });
        }
  
        // Add the products to the user's purchasedProducts field
        await this.userModel.findByIdAndUpdate(
          orders[0].buyerId,
          { $addToSet: { products: { $each: productIds } } },
          { new: true },
        );
  
        // Update or create wallets for sellers
        for (const [sellerId, transactionData] of Object.entries(sellerTransactions)) {
          let wallet = await this.walletModel.findOne({ owner: sellerId });
  
          if (!wallet) {
            // Create a new wallet if none exists
            wallet = new this.walletModel({
              owner: sellerId,
              balance: 0,
              transactions: [],
            });
          }
  
          // Update wallet balance and add transactions
          wallet.balance += transactionData.amount;
          wallet.transactions.push(...transactionData.transactions);
  
          await wallet.save();
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
        name: order.buyerId?.name || order.name || 'N/A',
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
      createdAt: order.createdAt ? order.createdAt : 'N/A',

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
      createdAt: order.createdAt ? order.createdAt : 'N/A',

    }));
  }

  async getOrderById(user: string, orderId: string) {
    const orders = await this.orderModel
      .findOne({
        _id: orderId,
        $or: [{ buyerId: user }, { sellerId: user }],
      })
      .populate<{ product: populatedProduct }>('product', 'name thumbnail price') // Populate product details
      .populate<{ sellerId: populatedUser }>('sellerId', 'name email') // Populate seller details
      .populate<{ buyerId: populatedUser }>('buyerId', 'name email'); // Populate buyer details

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
        name: orders.buyerId?.name || orders.name || 'N/A',
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
      createdAt: orders.createdAt ? orders.createdAt : 'N/A',
      shippedDate: orders.shippedDate ? orders.shippedDate : 'N/A',
      deliveredDate: orders.deliveredDate ? orders.deliveredDate : 'N/A',
      receivedDate: orders.receivedDate ? orders.receivedDate : 'N/A',
      cancelledDate: orders.cancelledDate ? orders.cancelledDate : 'N/A',
      orderNumber: orders.orderNumber || 'N/A',
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
        name: order.buyerId.name || order.name || 'N/A',
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
      createdAt: order.createdAt ? order.createdAt : 'N/A',

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
        order.cancelledDate = new Date();
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

  async syncOrderAnalytics(userId: string) {
    // Total number of products owned by the seller
    const totalProductBySeller = await this.productModel
      .find({ owner: userId })
      .countDocuments();
  
    // Total orders received by the seller
    const totalOrderReceived = await this.orderModel
      .find({ sellerId: userId })
      .countDocuments();
  
    // Total orders confirmed for the seller
    const totalOrderConfirmed = await this.orderModel
      .find({ sellerId: userId, status: 'confirmed' })
      .countDocuments();
  
    // Total orders placed by the buyer
    const totalOrderPlaced = await this.orderModel
      .find({ buyerId: userId })
      .countDocuments();
  
    // Orders with specific delivery statuses
    const totalOrderReceivedBySeller = await this.orderModel
      .find({ sellerId: userId, deliveryStatus: 'accepted' })
      .countDocuments();
  
    const totalOrderPendingBySeller = await this.orderModel
      .find({ sellerId: userId, deliveryStatus: 'pending' })
      .countDocuments();

      const totalBuyers = await this.userModel.find({ role: 'buyer' }).countDocuments();
      const totalSellers = await this.userModel.find({ role: 'seller' }).countDocuments();

      const pendingDeliveryByBuyer = await this.orderModel.find({ deliveryStatus: 'pending', buyerId: userId }).countDocuments();
  
    // Sum up total sales (totalPrice) across all orders (admin perspective)
    const totalSalesByAdminResult = await this.orderModel.aggregate([
      { $match: { totalPrice: { $gt: 0 } } },
      { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } },
    ]);
    const totalSalesByAdmin = totalSalesByAdminResult.length
      ? totalSalesByAdminResult[0].totalSales
      : 0;
  
    // Sum up total spending by the buyer
    const totalSpentByBuyerResult = await this.orderModel.aggregate([
      { $match: { buyerId: userId, totalPrice: { $gt: 0 } } },
      { $group: { _id: null, totalSpent: { $sum: '$totalPrice' } } },
    ]);
    const totalSpentByBuyer = totalSpentByBuyerResult.length
      ? totalSpentByBuyerResult[0].totalSpent
      : 0;
  
    // Return all analytics
    return {
      totalProductBySeller,
      totalOrderReceived,
      totalOrderConfirmed,
      totalOrderPlaced,
      totalOrderReceivedBySeller,
      totalOrderPendingBySeller,
      totalSalesByAdmin,
      totalSpentByBuyer,
      totalBuyers,
      totalSellers,
      pendingDeliveryByBuyer
    };
  }

  async getMonthlyAnalytics(userId: string): Promise<any> {
    const year = new Date().getFullYear();
  
    // Total sales by seller for each month
    const totalSales = await this.orderModel.aggregate([
      { $match: { sellerId: new Types.ObjectId(userId), deliveryStatus: "completed" } }, // Filter seller's completed orders
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalSales: { $sum: "$totalPrice" }, // Sum totalPrice for sales
        },
      },
      { $match: { "_id.year": year } }, // Filter for current year
      { $sort: { "_id.month": 1 } }, // Sort by month
    ]);
  
    // Total spending by buyer for each month
    const totalSpending = await this.orderModel.aggregate([
      { $match: { buyerId: new Types.ObjectId(userId), deliveryStatus: "completed" } }, // Filter buyer's completed orders
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalSpending: { $sum: "$totalPrice" }, // Sum totalPrice for spending
        },
      },
      { $match: { "_id.year": year } }, // Filter for current year
      { $sort: { "_id.month": 1 } }, // Sort by month
    ]);

    const totalPlatFormSales = await this.orderModel.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalSales: { $sum: "$totalPrice" }, // Sum totalPrice for sales
        },
      },
      { $match: { "_id.year": year }},
      { $sort: { "_id.month": 1 } }, // Sort by month
    ])
  
    // Formatting the results for better readability
    const formatData = (data: any) => {
      const monthlyData = Array(12).fill(0); // Initialize array for 12 months
      data.forEach((item: any) => {
        monthlyData[item._id.month - 1] = item.totalSales || item.totalSpending; // Map data to respective month
      });
      return monthlyData;
    };
  
    return {
      totalSales: formatData(totalSales),
      totalSpending: formatData(totalSpending),
      totalPlatFormSales: formatData(totalPlatFormSales)
    };
  }

  async getTopProducts(): Promise<any> {
  const topProducts = await this.orderModel.aggregate([
    // Filter only completed or confirmed orders
    { $match: {status: 'confirmed' } },

    // Group by productId
    {
      $group: {
        _id: '$product', // Group by productId
        totalSales: { $sum: '$totalPrice' }, // Sum up totalPrice
        totalQuantity: { $sum: '$quantity' }, // Sum up quantity
      },
    },

    // Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },

    // Limit to top 5 products
    { $limit: 5 },

    // Lookup product details
    {
      $lookup: {
        from: 'products', // Replace 'products' with your product collection name
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails',
      },
    },

    // Project the desired fields
    {
      $project: {
        _id: 0,
        productId: '$_id',
        totalSales: 1,
        totalQuantity: 1,
        productDetails: {
          name: { $arrayElemAt: ['$productDetails.name', 0] }, // Include only the 'name' field
          price: { $arrayElemAt: ['$productDetails.price', 0] }, // Include only the 'price' field
          category: { $arrayElemAt: ['$productDetails.category', 0] }, // Include only the 'category' field
          thumbnail: { $arrayElemAt: ['$productDetails.thumbnail', 0] },
          status: { $arrayElemAt: ['$productDetails.status', 0] },
          quantity: { $arrayElemAt: ['$productDetails.quantity', 0] },
        },
      }      
    },
  ]);

  return topProducts;
}
 
async getEarningsAndPayouts(){
  const analytics = await this.orderModel.aggregate([
    {
      // Match orders that are confirmed or successfully paid
      $match: { status: 'confirmed' },
    },
    {
      // Group by year and month and calculate total earnings
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalEarnings: { $sum: '$totalPrice' }, // Calculate total sales for the month
      },
    },
    {
      // Calculate payouts (80% of earnings) and admin share (20%)
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        totalEarnings: 1,
        payouts: { $multiply: ['$totalEarnings', 0.8] }, // 80% of earnings
        adminShare: { $multiply: ['$totalEarnings', 0.2] }, // 20% of earnings
      },
    },
    {
      // Optionally sort by year and month
      $sort: { year: 1, month: 1 },
    },
  ]);
  return analytics;
}

async saleByCategory(){
  const salesByCategory = await this.orderModel.aggregate([
    {
      // Match confirmed or completed orders
      $match: { status: 'confirmed' },
    },
    {
      // Unwind the products array to work with individual product entries
      $unwind: '$products',
    },
    {
      // Lookup product details to fetch categoryId and price
      $lookup: {
        from: 'products', // Collection name of Product schema
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    {
      // Unwind the populated product details
      $unwind: '$productDetails',
    },
    {
      // Group by categoryId and sum the total sales (price * quantity)
      $group: {
        _id: '$productDetails.categoryId', // Group by categoryId
        totalSales: {
          $sum: {
            $multiply: ['$products.quantity', '$productDetails.price'], // Calculate total sales
          },
        },
      },
    },
    {
      // Add a field to calculate the total sales across all categories
      $group: {
        _id: null, // Single document for overall total sales
        categories: { $push: { category: '$_id', totalSales: '$totalSales' } },
        overallSales: { $sum: '$totalSales' }, // Calculate total sales for all categories
      },
    },
    {
      // Calculate percentage contribution for each category
      $unwind: '$categories',
    },
    {
      $project: {
        _id: 0,
        categoryId: '$categories.category',
        totalSales: '$categories.totalSales',
        percentage: {
          $multiply: [{ $divide: ['$categories.totalSales', '$overallSales'] }, 100],
        },
      },
    },
    {
      // Sort by percentage contribution
      $sort: { percentage: -1 },
    },
  ]);
  return salesByCategory
}
  
}
