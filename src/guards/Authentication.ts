import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, TokenExpiredError, JsonWebTokenError } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorizationHeader = request.headers['authorization'];

        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authorizationHeader.split(' ')[1]; 

        try {
            const decoded: any = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });

            // Set user object and userId in the request
            request.user = decoded;
            request.userId = decoded.id;

            return true; 
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException('Token has expired');
            } else if (error instanceof JsonWebTokenError) {
                throw new UnauthorizedException('Invalid token');
            } else {
                throw new UnauthorizedException('Unauthorized');
            }
        }
    }
}
