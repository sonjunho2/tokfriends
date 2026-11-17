import { Module, forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WsModule } from '../ws/ws.module';
import { AiStaffModule } from '../ai-staff/ai-staff.module';

@Module({
  imports: [forwardRef(() => WsModule), forwardRef(() => AiStaffModule)],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
