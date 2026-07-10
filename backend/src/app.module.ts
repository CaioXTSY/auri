import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassesModule } from './modules/classes/classes.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { MissionsModule } from './modules/missions/missions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProgrammingModule } from './modules/programming/programming.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // limite geral; rotas sensíveis definem limites menores
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    GamificationModule,
    MissionsModule,
    DashboardModule,
    NotificationsModule,
    PostsModule,
    AdminModule,
    ProgrammingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
