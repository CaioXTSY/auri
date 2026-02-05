import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { MissionsModule } from './modules/missions/missions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 segundos
      limit: 10, // 10 requisições
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DisciplinesModule,
    ClassesModule,
    ActivitiesModule,
    SubmissionsModule,
    GamificationModule,
    MissionsModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
