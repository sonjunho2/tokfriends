import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SocialController } from './social.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, SocialController],
  exports: [UsersService],
})
export class UsersModule {}
