import { Module, forwardRef } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { AdminGateway } from './admin.gateway';
import { AiStaffController } from './ai-staff.controller';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [forwardRef(() => WsModule)],
  controllers: [AiStaffController],
  providers: [OrchestratorService, AdminGateway],
  exports: [OrchestratorService, AdminGateway],
})
export class AiStaffModule {}
