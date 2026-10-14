import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { PrivateCallService } from './private-call.service';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [forwardRef(() => WsModule)],
  controllers: [CallsController],
  providers: [CallsService, PrivateCallService, PrismaService],
  exports: [CallsService, PrivateCallService],
})
export class CallsModule {}
