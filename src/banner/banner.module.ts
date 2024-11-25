import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, bannerSchema } from './schema/banner';

@Module({
  imports:[MongooseModule.forFeature([{name: Banner.name, schema: bannerSchema}]),
  JwtModule.register({
    secret: process.env.JWT_SECRET, // Ensure this environment variable is set
    signOptions: { expiresIn: '5d' },
  }),
],
  providers: [BannerService],
  controllers: [BannerController]
})
export class BannerModule {}
