import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(email: string, password: string): Promise<{ token: string; userId: string } | null> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      console.log('User not found');
      return null;
    }
  
    console.log('Password from database (raw):', user.password);
    const trimmedPassword = user.password.trim();
    console.log('Password from database (trimmed):', trimmedPassword);
  
    const isPasswordValid = await bcrypt.compare(password, trimmedPassword);
    console.log('Password valid:', isPasswordValid);
  
    if (!isPasswordValid) {
      console.log('Invalid password');
      return null;
    }
  
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your_secret_key',
      { expiresIn: '1h' }
    );
  

    return { token, userId: user.id };
  }
}