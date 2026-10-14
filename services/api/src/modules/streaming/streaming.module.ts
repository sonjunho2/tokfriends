import { Module } from '@nestjs/common';
import { SnapshotAuditorService } from './snapshot-auditor.service';
import { SnapshotAuditorController } from './snapshot-auditor.controller';
import { LiveController } from './live.controller';
import { AiStaffModule } from '../ai-staff/ai-staff.module';

@Module({
  imports: [AiStaffModule],
  controllers: [SnapshotAuditorController, LiveController],
  providers: [SnapshotAuditorService],
  exports: [SnapshotAuditorService],
})
export class StreamingModule {}
