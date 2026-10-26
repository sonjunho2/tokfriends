import { Module } from '@nestjs/common';
import { SudaController } from './suda.controller';
import { CommunityController } from './community.controller';
import { SudaService } from './suda.service';

@Module({
  controllers: [SudaController, CommunityController],
  providers: [SudaService],
  exports: [SudaService],
})
export class SudaModule {}
