import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  assertProductionCorsOrigins,
  hasWildcardCorsOrigin,
  isCorsOriginAllowed,
  parseCorsOrigins,
} from './common/cors-origins';

function withPrefix(prefix: string, url: string) {
  if (!url) return prefix;
  return `${prefix}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOriginEnv = process.env.CORS_ORIGIN?.trim();

  const allowedOrigins = parseCorsOrigins(corsOriginEnv);

  assertProductionCorsOrigins(
    corsOriginEnv,
    isProduction,
    allowedOrigins,
  );
  const hasWildcard = hasWildcardCorsOrigin(allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // 서버간 통신/헬스체크 등 Origin 없는 요청 허용
      if (!origin) return callback(null, true);
      if (isCorsOriginAllowed(origin, allowedOrigins)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: !hasWildcard,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
    maxAge: 600,
  });

  const globalPrefix = process.env.API_PREFIX ?? 'v1';
  const prefixPath = `/${globalPrefix}`;
  const legacyBypassPrefixes = ['/socket.io'];

  app.setGlobalPrefix(globalPrefix);

  app.use((req: Request, res: Response, next) => {
    const path = req.path ?? req.url;
    if (path.startsWith(prefixPath)) return next();
    if (path === '/') return next();
    if (legacyBypassPrefixes.some((legacy) => path.startsWith(legacy))) return next();

    const target = withPrefix(prefixPath, req.originalUrl ?? req.url ?? '');

    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.redirect(308, target);
    }

    req.url = withPrefix(prefixPath, req.url ?? '');
    return next();
  });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Tok Friends API')
      .setDescription('HTTP API for the Tok Friends clients.')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });

    SwaggerModule.setup('docs', app, swaggerDocument, {
      jsonDocumentUrl: 'docs-json',
      useGlobalPrefix: true,
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
}
bootstrap();
