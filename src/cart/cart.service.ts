import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './schema/cart';
import { Model, ObjectId } from 'mongoose';
import { User } from 'src/auth/schema/auth.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(User.name) private userModel: Model<User>
) {}

async updateCart(body: { items: Array<{ product: string, quantity: number }> }, userId: string) {
    const { items } = body

    let cart = await this.cartModel.findOne({ user: userId });
    if(!cart) {
      cart = await this.cartModel.create({ user: userId, items: items });
    } else {
        for (const item of items) {
            const oldProduct = cart.items.find(
              ({ product }) => item.product === product.toString()
            );
            if (oldProduct) {
              // if there us old product update the count
              oldProduct.quantity += item.quantity;
              // if product is quantity is 0 remove the product
              if (oldProduct.quantity <= 0) {
                cart.items = cart.items.filter(
                  ({ product }) => item.product !== product.toString()
                );
              }
            } else {
              // if there is no old product add the new product
              cart.items.push({
                product: item.product as any,
                quantity: item.quantity,
              });
            }
          }
          await cart.save()
     }
     return {cart: cart._id}
  }

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ user: userId }).populate<{
        items: {
          quantity: number;
          product: {
            _id: ObjectId;
            name: string;
            thumbnail: string;
            price: number;
          };
        }[];
      }>({ path: "items.product", select: "_id name thumbnail price" });
    if(!cart) {
      return {message: "Cart not found", statusCode: 404}
    }
    const cartDetails = {
      id: cart._id,
      items: cart.items.map((item) => ({
        product: {
          id: item.product._id,
          name: item.product.name,
          thumbnail: item.product.thumbnail,
          price: item.product.price,
        },
        quantity: item.quantity,
      })),
    };
    return {cart: cartDetails
    }
  }

  async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate({ user: userId }, { items: [] });
    return { message: "Cart cleared", statusCode: 200 };
  }
}
