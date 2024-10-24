import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLE_KEY } from "src/decorator/role.decorator";

@Injectable()
export class AuthorizationGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const requiredRole = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
            context.getClass(),
            context.getHandler(),
        ]);

        const userRole = request.user?.role;
        const userId = request.user?.id; // Ensure user and id are accessed safely

        if (!requiredRole?.includes(userRole)) {
            throw new UnauthorizedException(`Unauthorized access, ${userRole} role is not allowed to access this resource`);
        }

        // Log and set additional properties if needed
        // console.log('Required roles:', requiredRole);
        // console.log('User ID:', userId);

        // Optionally, set userId and requiredRole in request for downstream use
        request.userId = userId;
        request.requiredRole = requiredRole;

        return true;
    }
}
