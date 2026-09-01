import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { DiscoverService } from './discover.service';
import { DiscoverController } from './discover.controller';

@Module({
  imports: [PrismaModule],
  providers: [DiscoverService],
  controllers: [DiscoverController],
})
export class DiscoverModule {}
