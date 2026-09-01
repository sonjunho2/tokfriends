import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export type LegalDocument = {
  slug: string;
  title: string;
  content: string;
};

@Injectable()
export class LegalDocumentsService {
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

    const fileDoc = await this.loadFromFiles(normalized);
    if (fileDoc) {
      return fileDoc;
    }

    const fallback = this.fallback[normalized];
    if (fallback) {
      return { slug: normalized, ...fallback };
    }

    throw new NotFoundException('Document not found');
  }

  private normalizeSlug(slug: string) {
    return slug?.toLowerCase().replace(/[^a-z0-9\-]/g, '') ?? '';
  }

  private async loadFromFiles(slug: string): Promise<LegalDocument | null> {
    const baseDir = process.env.LEGAL_DOCUMENTS_DIR ?? join(process.cwd(), 'docs', 'legal');
    const safeSlug = slug.replace(/\.\.+/g, '');
    const candidates = ['.json', '.html', '.htm', '.md', '.txt'].map((ext) => join(baseDir, `${safeSlug}${ext}`));

    for (const filePath of candidates) {
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;

        if (filePath.endsWith('.json')) {
          const raw = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.content) {
            return {
              slug,
              title: String(parsed.title ?? this.fallback[slug]?.title ?? slug),
              content: String(parsed.content ?? parsed.body ?? ''),
            };
          }
        } else {
          const content = await fs.readFile(filePath, 'utf8');
          return {
            slug,
            title: this.extractTitle(content, slug),
            content,
          };
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
