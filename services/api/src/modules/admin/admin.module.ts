import { Module, forwardRef } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { PrismaService } from 'nestjs-prisma';
import { CallsModule } from '../calls/calls.module';

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [SystemSettingsController],
  providers: [PrismaService],
  exports: [],
})
export class AdminModule {}
