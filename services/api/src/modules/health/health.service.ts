import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

type HealthComponent = {
  name: string;
  ok: boolean;
  details?: string;
  skipped?: boolean;
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{ ok: boolean; timestamp: string; components: HealthComponent[] }> {
    const components: HealthComponent[] = [];

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      components.push({ name: 'database', ok: true });
    } catch (error: any) {
      components.push({
        name: 'database',
        ok: false,
        details: error?.message ?? String(error),
      });
    }

    components.push({
      name: 'queue',
      ok: true,
      skipped: !process.env.QUEUE_PROVIDER,
      details: process.env.QUEUE_PROVIDER ? 'configured' : 'QUEUE_PROVIDER not set, skipping check',
    });

    const ok = components.every((component) => component.ok);
    return { ok, timestamp: new Date().toISOString(), components };
  }
}
