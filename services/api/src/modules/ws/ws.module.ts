import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class WsModule {}
