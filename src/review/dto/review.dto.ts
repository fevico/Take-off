import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class AddRatingDto{
    @IsNotEmpty()
    @IsNumber()
    rating: number;

    @IsString()
    @IsNotEmpty()
    content: string

    @IsString()
    @IsNotEmpty()
    product: string
}