import { Global, Module } from '@nestjs/common';
import { AdminSecurityService } from './admin-security.service';
import { AdminSecurityController } from './admin-security.controller';

@Global()
@Module({
  controllers: [AdminSecurityController],
  providers: [AdminSecurityService],
  exports: [AdminSecurityService],
})
export class AdminSecurityModule {}