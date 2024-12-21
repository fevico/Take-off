import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { UploadMiddleware } from './middleware/fileParser';
import { GoogleModule } from './google/google.module';
import { SellerModule } from './seller/seller.module';
import { OrderModule } from './order/order.module';
import { CartModule } from './cart/cart.module';
import { BannerModule } from './banner/banner.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
          // Load environment variables from .env file
          ConfigModule.forRoot({
            envFilePath: '.env', // Specify the path to your .env file
            isGlobal: true, // Make configuration global
          }),
        MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    CategoryModule,
    ProductModule,
    GoogleModule,
    SellerModule,
    OrderModule,
    CartModule,
    BannerModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UploadMiddleware)
      .forRoutes(
        { path: 'category/create', method: RequestMethod.POST },
        { path: 'category/:id', method: RequestMethod.PATCH },
        { path: 'product/create', method: RequestMethod.POST },
        { path: 'product/update/:id', method: RequestMethod.PATCH },
        { path: 'auth/update-profile', method: RequestMethod.PATCH },
        { path: 'banner/create', method: RequestMethod.POST },
      );
  }
}