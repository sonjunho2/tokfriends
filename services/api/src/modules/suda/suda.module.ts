import { Module } from '@nestjs/common';
import { SudaController } from './suda.controller';
import { SudaService } from './suda.service';

@Module({
  controllers: [SudaController],
  providers: [SudaService],
  exports: [SudaService],
})
export class SudaModule {}
