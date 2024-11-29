import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    const loginResult = await this.authService.login(email, password);
  
    if (!loginResult) {
      throw new BadRequestException('Invalid email or password');
    }
  
    const { token, userId } = loginResult;
  
    return { 
      message: 'Login successful', 
      token, 
      userId
    };
  }
}