import { Body, Controller, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenitcationGuard } from 'src/guards/Authentication';
import { Request } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterUserDto, ResendTokenDto, SignUpDto, VerifyTokenDto } from './dto/auth.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('create')
    @ApiOperation({
      summary: 'Create a new user record',
      description: 'This endpoint allows you to create a new user with the specified email and password.'
    })
    @ApiResponse({
      status: 201,
      description: 'The user record has been successfully created',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '60b6aeb8b4e312c8a8c19d5e' },
          email: { type: 'string', example: 'example@example.com' },
          createdAt: { type: 'string', example: '2024-09-05T12:34:56.789Z' },
          updatedAt: { type: 'string', example: '2024-09-05T12:34:56.789Z' },
        },
      },
    })
    @ApiResponse({
      status: 400,
      description: 'Bad Request. Validation error or missing fields.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Validation failed' },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    })
    @ApiResponse({
      status: 403,
      description: 'Forbidden. User does not have the necessary permissions.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    })
    createUser(@Body() body: SignUpDto) {
      return this.authService.createUser(body);
    }

    @Post('resend-token')
    @ApiOperation({
        summary: 'Resend verification token',
        description: 'This endpoint allows user resend verification token if the token was not received initially.'
      })
      // @ApiBody({
      //   description: 'Details of the user to create',
      //   type: 'object',
      //   schema: {
      //     type: 'object',
      //     properties: {
      //       email: {
      //         type: 'string',
      //         example: 'example@example.com',
      //         description: 'User email address',
      //       },
      //     },
      //   },
      // })
      @ApiBody({ type: ResendTokenDto }) // Use the DTO here
 
      @ApiResponse({
        status: 201, // 201 is more appropriate for successful creation
        description: 'please check your email for the verification token',
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '60b6aeb8b4e312c8a8c19d5e' },
            token: { type: 'string', example: '1234' },
          },
        },
      }) 
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    resendToken(@Body() body: ResendTokenDto){
        return this.authService.resendToken(body)
    }
    
    @Post('verify-token')
    @ApiOperation({
        summary: 'Verify verification token',
        description: 'This endpoint allows user verify verification token sent to their email.'
      })
      @ApiBody({
        description: 'Details of token to be verified',
        type: 'object',
        schema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: '12345',
              description: 'token sent to user email',
            },
            userId: {
              type: 'string',
              example: '60b6aeb8b4e312c8a8c19d5e',
              description: 'id of the verification user',
            },
          },
        },
      })
      @ApiBody({ type: VerifyTokenDto }) // Use the DTO here

      @ApiResponse({
        status: 200, // 201 is more appropriate for successful creation
        description: 'User verified successfully',
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '60b6aeb8b4e312c8a8c19d5e' },
            token: { type: 'string', example: '1234' },
          },
        },
      }) 
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    verifyEmail(@Body() body: VerifyTokenDto){ 
        return this.authService.verifyEmail(body)
    }

    @Post('login')
    @ApiOperation({
        summary: 'Login a user',
        description: 'This endpoint login a user with their registered email and password.'
      })
      @ApiBody({
        description: 'Details of user to be logged in',
        type: 'object',
        schema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              example: 'user@example.com',
              description: 'user registered email',
            },
            password: {
              type: 'string',
              example: 'password123',
              description: 'user password',
            },
          },
        },
      })
      @ApiBody({ type: LoginDto }) // Use the DTO here

      @ApiResponse({
        status: 200, // 201 is more appropriate for successful creation
        description: 'User verified successfully',
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1pa2VsQGdtYWlsLmNvbSIsImlkIjoiNjZkNmU0YjE5YjZlZTg2Y2FkODcyNzE2IiwiaWF0IjoxNzI1NDUxMzkyLCJleHAiOjE3MjU0NTQ5OTJ9.gtm1TNxCfBzjHYvcWjBhRDa1qcafgnEm8fHFKpbp0H0' },
            id: { type: 'string', example: '66d6e4b19b6ee86cad872716' },
          },
        },
      }) 
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    login(@Body() body: LoginDto){
        
        return this.authService.login(body)
    }

    @Put('register')
    @ApiOperation({
        summary: 'Register an existing user',
        description: 'This endpoint is the next endpoint after signup where user provided other registration details.'
      })
      @ApiBody({
        description: 'Details of user to be logged in',
        type: 'object',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
              description: 'user name',
            },
            userId: {
              type: 'string',
              example: '66d6e4b19b6ee86cad872716',
              description: 'user id',
            },
            phone: {
              type: 'number',
              example: 8136819208,
              description: 'user phone number',
            },
          },
        },
      })
      @ApiBody({ type: RegisterUserDto }) // Use the DTO here

      @ApiResponse({
        status: 200, // 201 is more appropriate for successful creation
        description: 'User registration completed successfully',
        schema: {
          type: 'object',
          properties: {
            phone: { type: 'number', example: 8136819208 },
            id: { type: 'string', example: '66d6e4b19b6ee86cad872716' },
            name: { type: 'string', example: 'John Doe' },
          },
        },
      }) 
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    register(@Body() body: RegisterUserDto){
        return this.authService.register(body)
    }

    @Patch('update-profile')
    @ApiOperation({
        summary: 'Update user profile',
        description: 'This endpoint update users profile only if they are logged in.'
      })
      @ApiBody({
        description: 'Details of user profile to be updated',
        type: 'object',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
              description: 'user name',
            },
            address: {
              type: 'string',
              example: 'califonia usa',
              description: 'user address',
            },
            phone: {
              type: 'number',
              example: 8136819208,
              description: 'user phone number',
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
              description: 'user profile picture',
            },
          },
        },
      })
      @ApiResponse({
        status: 200, // 201 is more appropriate for successful creation
        description: 'User registration completed successfully',
        schema: {
          type: 'object',
          properties: {
            phone: { type: 'number', example: 8136819208 },
            address: { type: 'string', example: 'califonia usa' },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            name: { type: 'string', example: 'John Doe' },
          },
        },
      }) 
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    @UseGuards(AuthenitcationGuard)
    updateProfile(@Body() body: any, @Req() req: Request){
        const fields = req.body as Record<string, any>; 
        const files = req['files'] as Record<string, any>;
        const userId = req.user.id
    
        // Check and convert if fields.name is an array
        if (Array.isArray(fields.avatar)) {
          fields.avatar = fields.avatar[0];
        }    
        if (Array.isArray(fields.name)) {
          fields.name = fields.name[0];
        }    
        if (Array.isArray(fields.address)) {
          fields.address = fields.address[0];
        }    
        if (Array.isArray(fields.phone)) {
          fields.phone = fields.phone[0];
        }    
        return this.authService.updateProfile(body, fields, files, userId)
    }

} 
