import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { GamificationModule } from './modules/gamification/gamification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
})
export class AppModule {}
