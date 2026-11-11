import { Module, forwardRef } from '@nestjs/common';
import { SudaController } from './suda.controller';
import { CommunityController } from './community.controller';
import { SudaService } from './suda.service';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [forwardRef(() => WsModule)],
  controllers: [SudaController, CommunityController],
  providers: [SudaService],
  exports: [SudaService],
})
export class SudaModule {}
