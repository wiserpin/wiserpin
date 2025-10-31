import { Injectable, UnauthorizedException } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<any> {
    try {
      const sessionClaims = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      return sessionClaims;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUser(userId: string): Promise<any> {
    try {
      return await clerkClient.users.getUser(userId);
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
}
