import { Module } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  providers: [NotificationsService, PrismaService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
