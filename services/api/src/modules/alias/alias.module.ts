// services/api/src/modules/alias/alias.module.ts
import { Module } from '@nestjs/common';
import { AliasController } from './alias.controller';

@Module({
  controllers: [AliasController],
})
export class AliasModule {}
