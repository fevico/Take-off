import { Body, Controller, Post, Req } from '@nestjs/common';
import { BannerService } from './banner.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('banner')
@ApiTags('Banner')
export class BannerController {
    constructor(private bannerService: BannerService) {}

    @Post('create')
    createBanner(@Req() req: Request) {
        const fields = req.body as Record<string, any>; // Use a more specific type if possible
        const files = req['files'] as Record<string, any>;
    
        // Check and convert if fields.name is an array
        if (Array.isArray(fields.name)) {
          fields.name = fields.name[0];
        }    
        if (Array.isArray(fields.description)) {
          fields.description = fields.description[0];
        }    

        return this.bannerService.createBanner(fields, files);
    }
}
