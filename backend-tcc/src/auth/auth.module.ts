import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from 'src/users/users.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [AuthService, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
  imports: [DatabaseModule]
})
export class AuthModule {}