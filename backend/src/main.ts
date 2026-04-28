import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const corsEnv =
    process.env.CORS_ORIGINS ||
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    '';
  const allowedOrigins = corsEnv
    ? corsEnv
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  if (process.env.NODE_ENV !== 'production') {
    for (const developmentOrigin of [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]) {
      if (!allowedOrigins.includes(developmentOrigin)) {
        allowedOrigins.push(developmentOrigin);
      }
    }
  }

  const port = process.env.PORT || '3001';
  const localBackendOrigin = `http://localhost:${port}`;
  if (!allowedOrigins.includes(localBackendOrigin)) {
    allowedOrigins.push(localBackendOrigin);
  }

  const backendUrl = process.env.BACKEND_URL || '';
  if (backendUrl && !allowedOrigins.includes(backendUrl)) {
    allowedOrigins.push(backendUrl);
  }

  const allowAllOrigins = allowedOrigins.includes('*');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed: ${origin}`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('AURI API')
    .setDescription('API da plataforma gamificada de ensino de programação')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('users', 'Gestão de usuários')
    .addTag('classes', 'Gestão de turmas')
    .addTag('gamification', 'Sistema de gamificação')
    .addTag('missions', 'Missões e rotina')
    .addTag('notifications', 'Notificações')
    .addTag('posts', 'Postagens e respostas em markdown')
    .addTag('dashboard', 'Visão consolidada do aluno')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  app.enableShutdownHooks();

  const numericPort = Number(port);
  await app.listen(numericPort);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs\n`);
}

bootstrap();
