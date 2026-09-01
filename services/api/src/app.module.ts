import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { PostsModule } from './modules/posts/posts.module';
import { JwtAuthGuard } from './modules/auth/jwt.guard';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { DiscoverModule } from './modules/discover/discover.module';
import { TopicsModule } from './modules/topics/topics.module';
import { CommunityModule } from './modules/community/community.module';
import { AdminModule } from './modules/admin/admin.module';
import { GiftsModule } from './modules/gifts/gifts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
