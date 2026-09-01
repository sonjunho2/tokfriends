// 새 파일: services/api/src/modules/legacy/legacy.module.ts
import { Module } from '@nestjs/common';
import { LegacyController } from './legacy.controller';

@Module({
  controllers: [LegacyController],
})
export class LegacyModule {}
