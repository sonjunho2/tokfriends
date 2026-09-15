import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "nestjs-prisma";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { HealthModule } from "./modules/health/health.module";
import { ChatsModule } from "./modules/chats/chats.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { PostsModule } from "./modules/posts/posts.module";
import { JwtAuthGuard } from "./modules/auth/jwt.guard";
import { FriendshipsModule } from "./modules/friendships/friendships.module";
import { DiscoverModule } from "./modules/discover/discover.module";
import { TopicsModule } from "./modules/topics/topics.module";
import { CommunityModule } from "./modules/community/community.module";
import { AdminModule } from "./modules/admin/admin.module";
import { GiftsModule } from "./modules/gifts/gifts.module";
import { StoreModule } from "./modules/store/store.module";
import { LegalDocumentsModule } from "./modules/legal-documents/legal-documents.module";
import { MediaModule } from "./modules/media/media.module";
import { AdminPermissionsGuard } from "./common/admin-permissions.guard";
import { AdminSecurityModule } from "./modules/admin-security/admin-security.module";
import { FollowsModule } from "./modules/follows/follows.module";
import { InterestsModule } from "./modules/interests/interests.module";
import { ProfileVisitsModule } from "./modules/profile-visits/profile-visits.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    ReportsModule,
    MetricsModule,
    AnnouncementsModule,
    PostsModule,
    TopicsModule,
    CommunityModule,
    FriendshipsModule,
    DiscoverModule,
    AdminModule,
    GiftsModule,
    StoreModule,
    LegalDocumentsModule,
    MediaModule,
    AdminSecurityModule,
    FollowsModule,
    InterestsModule,
    ProfileVisitsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AdminPermissionsGuard },
  ],
})
export class AppModule {}
