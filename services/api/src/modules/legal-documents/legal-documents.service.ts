import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from 'nestjs-prisma';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';

export type LegalDocumentVersion = {
  version: number;
  title: string;
  content: string;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
  memo: string | null;
};

export type LegalDocument = {
  slug: string;
  title: string;
  content: string;
  body: string;
  version: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
  history: LegalDocumentVersion[];
};

@Injectable()
export class LegalDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fallback: Record<string, { title: string; content: string }> = {
    'privacy-policy': {
      title: '개인정보 처리방침',
      content:
        '톡프렌즈는 회원의 개인정보를 보호하기 위해 필요한 최소한의 정보만 수집하며, 이용 목적과 보관 기간을 투명하게 안내합니다. 자세한 내용은 서비스 내 설정 화면에서 확인하실 수 있습니다.',
    },
    'terms-of-service': {
      title: '서비스 이용약관',
      content:
        '톡프렌즈 서비스 이용약관은 회원의 권리와 의무, 서비스 이용 절차, 제한 및 해지 조건 등을 규정합니다. 앱을 이용하기 전 반드시 약관을 확인하시고 동의해 주시기 바랍니다.',
    },
    'location-based-service': {
      title: '위치기반서비스 이용약관',
      content:
        '위치기반 서비스를 이용할 때 적용되는 권리와 의무, 위치 정보의 수집·이용·제공에 관한 사항을 안내합니다. 사용자는 언제든 위치정보 이용 동의를 철회할 수 있습니다.',
    },
  };

  async getBySlug(slug: string): Promise<LegalDocument> {
    const normalized = this.normalizeSlug(slug);
    if (!normalized) {
      throw new NotFoundException('Document not found');
    }

    const dbDocument = await this.prisma.legalDocument.findUnique({
      where: { slug: normalized },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 15,
        },
      },
    });

    if (dbDocument) {
      return {
        slug: dbDocument.slug,
        title: dbDocument.title,
        content: dbDocument.content,
        body: dbDocument.content,
        version: dbDocument.version,
        updatedAt: dbDocument.updatedAt.toISOString(),
        updatedBy: dbDocument.updatedBy,
        history: dbDocument.versions.map((entry) => ({
          version: entry.version,
          title: entry.title,
          content: entry.content,
          body: entry.content,
          updatedAt: entry.createdAt.toISOString(),
          updatedBy: entry.updatedBy,
          memo: entry.memo,
        })),
      };
    }

    const fileDoc = await this.loadFromFiles(normalized);
    if (fileDoc) {
      return fileDoc;
    }

    const fallback = this.fallback[normalized];
    if (fallback) {
      return this.makeFallbackDocument(normalized, fallback.title, fallback.content);
    }

    throw new NotFoundException('Document not found');
  }

  async updateBySlug(
    actorId: string,
    slug: string,
    dto: UpdateLegalDocumentDto,
  ): Promise<LegalDocument> {
    const normalized = this.normalizeSlug(slug);

    if (!normalized || !this.fallback[normalized]) {
      throw new NotFoundException('Document not found');
    }

    const actor = await this.requireSettingsActor(actorId);

    const title = dto.title.trim();
    const content = dto.body.trim();
    const memo = dto.memo?.trim() || null;

    if (!title) {
      throw new BadRequestException('Document title is required');
    }

    if (!content) {
      throw new BadRequestException('Document body is required');
    }

    const updatedBy =
      dto.updatedBy?.trim() ||
      actor.displayName?.trim() ||
      actor.email?.trim() ||
      actor.id;

    const saved = await this.prisma.$transaction(async (tx) => {
      const document = await tx.legalDocument.upsert({
        where: { slug: normalized },
        create: {
          slug: normalized,
          title,
          content,
          version: 1,
          updatedBy,
        },
        update: {
          title,
          content,
          updatedBy,
          version: { increment: 1 },
        },
      });

      await tx.legalDocumentVersion.create({
        data: {
          documentSlug: normalized,
          version: document.version,
          title,
          content,
          updatedBy,
          memo,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          target: `legal-document:${normalized}`,
          action: `UPDATE_LEGAL_DOCUMENT:v${document.version}`,
          notes: memo,
        },
      });

      const history = await tx.legalDocumentVersion.findMany({
        where: { documentSlug: normalized },
        orderBy: { version: 'desc' },
        take: 15,
      });

      return { document, history };
    });

    return {
      slug: saved.document.slug,
      title: saved.document.title,
      content: saved.document.content,
      body: saved.document.content,
      version: saved.document.version,
      updatedAt: saved.document.updatedAt.toISOString(),
      updatedBy: saved.document.updatedBy,
      history: saved.history.map((entry) => ({
        version: entry.version,
        title: entry.title,
        content: entry.content,
        body: entry.content,
        updatedAt: entry.createdAt.toISOString(),
        updatedBy: entry.updatedBy,
        memo: entry.memo,
      })),
    };
  }

  private async requireSettingsActor(actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        adminProfile: {
          select: {
            role: true,
            status: true,
            permissions: true,
          },
        },
      },
    });

    if (!actor || actor.role !== 'admin' || actor.status !== 'active') {
      throw new ForbiddenException('Active admin account required');
    }

    if (!actor.adminProfile || actor.adminProfile.status !== 'ACTIVE') {
      throw new ForbiddenException('Active admin profile required');
    }

    if (
      actor.adminProfile.role !== 'SUPER_ADMIN' &&
      !actor.adminProfile.permissions.includes('settings.manage')
    ) {
      throw new ForbiddenException('Settings permission required');
    }

    return actor;
  }

  private normalizeSlug(slug: string) {
    return slug?.toLowerCase().replace(/[^a-z0-9\-]/g, '') ?? '';
  }

  private makeFallbackDocument(
    slug: string,
    title: string,
    content: string,
  ): LegalDocument {
    return {
      slug,
      title,
      content,
      body: content,
      version: null,
      updatedAt: null,
      updatedBy: null,
      history: [],
    };
  }

  private async loadFromFiles(slug: string): Promise<LegalDocument | null> {
    const baseDir =
      process.env.LEGAL_DOCUMENTS_DIR ?? join(process.cwd(), 'docs', 'legal');
    const safeSlug = slug.replace(/\.\.+/g, '');
    const candidates = ['.json', '.html', '.htm', '.md', '.txt'].map((ext) =>
      join(baseDir, `${safeSlug}${ext}`),
    );

    for (const filePath of candidates) {
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;

        if (filePath.endsWith('.json')) {
          const raw = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(raw);

          if (parsed && typeof parsed === 'object' && parsed.content) {
            const content = String(parsed.content ?? parsed.body ?? '');
            return this.makeFallbackDocument(
              slug,
              String(parsed.title ?? this.fallback[slug]?.title ?? slug),
              content,
            );
          }
        } else {
          const content = await fs.readFile(filePath, 'utf8');
          return this.makeFallbackDocument(
            slug,
            this.extractTitle(content, slug),
            content,
          );
        }
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          continue;
        }
      }
    }

    return null;
  }

  private extractTitle(content: string, slug: string) {
    const headingMatch = content.match(/^#\s*(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    return this.fallback[slug]?.title ?? slug;
  }
}