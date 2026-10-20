import { Module, forwardRef } from '@nestjs/common';
import { SnapshotAuditorService } from './snapshot-auditor.service';
import { SnapshotAuditorController } from './snapshot-auditor.controller';
import { LiveController } from './live.controller';
import { AiStaffModule } from '../ai-staff/ai-staff.module';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [AiStaffModule, forwardRef(() => WsModule)],
  controllers: [SnapshotAuditorController, LiveController],
  providers: [SnapshotAuditorService],
  exports: [SnapshotAuditorService],
})
export class StreamingModule {}

