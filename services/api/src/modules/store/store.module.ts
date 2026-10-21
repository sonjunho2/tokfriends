import { Module, forwardRef } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [forwardRef(() => AdminModule)],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}

