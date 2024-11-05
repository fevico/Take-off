import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class BecomeSellerDto{
    @ApiProperty({
        description: 'User email',
        example: 'example@example.com'
      })
    @IsNotEmpty()
    @IsString()
    email: string;
}