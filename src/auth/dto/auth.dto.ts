import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class SignUpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'example@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123'
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'User role',
    example: 'buyer'
  })
  @IsNotEmpty()
  @IsString()
  role: string;
}


export class ResendTokenDto {
  @ApiProperty({
    description: 'User email address',
    example: 'example@example.com'
  })

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyTokenDto {
  @ApiProperty({
    description: 'User verification token',
    example: '1234'
  })

  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'User Id',
    example: '6bd9f4b7-5b1e-4c2a-9d9d-6b9d4b75b1e4'
  })

  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'example@example.com'
  })

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'examplePassword'
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  phone: number;
}