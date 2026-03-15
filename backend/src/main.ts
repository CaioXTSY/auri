import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS - liberar para qualquer origem em desenvolvimento
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AURI API')
    .setDescription('API da plataforma gamificada de ensino de programação')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('users', 'Gestão de usuários')
    .addTag('classes', 'Gestão de turmas')
    .addTag('activities', 'Gestão de atividades')
    .addTag('submissions', 'Submissões de código')
    .addTag('gamification', 'Sistema de gamificação')
    .addTag('missions', 'Missões e rotina')
    .addTag('ai', 'Assistente de IA')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs\n`);
}

bootstrap();
