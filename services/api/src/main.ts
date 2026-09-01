import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

type AllowedOrigin = string | RegExp;

function parseOrigins(env?: string): AllowedOrigin[] {
  if (!env) return ['*'];
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value) => {
      if (value.startsWith('/') && value.endsWith('/') && value.length > 2) {
        try {
          return new RegExp(value.slice(1, -1));
        } catch {
          return value;
        }
      }
      return value;
    });
}

function isOriginAllowed(origin: string, allowedOrigins: AllowedOrigin[]): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return allowed === origin;
  });
}

function withPrefix(prefix: string, url: string) {
  if (!url) return prefix;
  return `${prefix}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? 4000);
  const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
  const hasWildcard = allowedOrigins.some(
    (candidate) => typeof candidate === 'string' && candidate === '*',
  );

  app.enableCors({
    origin: (origin, callback) => {
      // 서버간 통신/헬스체크 등 Origin 없는 요청 허용
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
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

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
}
bootstrap();
