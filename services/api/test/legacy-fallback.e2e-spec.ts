// 새 파일: services/api/test/legacy-fallback.e2e-spec.ts
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/modules/app.module';

describe('Legacy fallback POST (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 410 for legacy sequential POST paths', async () => {
    await request(app.getHttpServer())
      .post('/auth/register') // representative legacy path captured by tryPostJsonSequential
      .set('Authorization', 'Bearer dummy-token')
      .send({ email: 'legacy@example.com' })
      .expect(410);
  });
});
