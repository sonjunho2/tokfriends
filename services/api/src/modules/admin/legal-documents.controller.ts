import { Controller, Get, Put, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Public } from '../auth/public.decorator';

export class UpdateLegalDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

const DEFAULT_DOCUMENTS: Record<string, { title: string; content: string }> = {
  'privacy-policy': {
    title: 'TokFriends 개인정보 처리방침',
    content:
      'TokFriends는 회원님의 개인정보를 안전하게 관리하기 위해 관련 법령과 내부 보안 정책을 준수합니다.\n\n1. 수집 항목: 필수(전화번호, 닉네임, 생년월일), 선택(관심사, 위치)\n2. 이용 목적: 매칭 추천, 고객 지원, 부정행위 방지\n3. 보관 및 파기: 탈퇴 후 30일 내 파기, 법령상 보관 예외 존재.\n\n자세한 내용은 관리 콘솔에서 항목별로 갱신하세요.',
  },
  'terms-of-service': {
    title: 'TokFriends 이용약관',
    content:
      'TokFriends를 이용해 주셔서 감사합니다. 본 약관은 TokFriends가 제공하는 모든 서비스에 적용됩니다.\n\n1. 계정 생성 및 관리\n2. 서비스 이용 시 주의사항과 금지 행위\n3. 유료 상품 및 환불 정책\n4. 면책 조항 및 분쟁 해결\n\n정책 변경 시 고객에게 사전 공지하고 개별 동의를 다시 받아야 합니다.',
  },
  'location-based-service': {
    title: 'TokFriends 위치기반서비스 이용약관',
    content:
      'TokFriends는 정확한 매칭을 위해 회원님의 위치기반 서비스를 제공합니다.\n\n1. 위치정보의 수집 방법과 주기\n2. 이용 목적 및 보유 기간\n3. 보호조치, 이용자의 권리와 행사 방법\n4. 위치정보 관리자 및 연락처\n\n관련 법령의 요구사항을 충족하도록 세부 항목을 갱신하세요.',
  },
};

@ApiTags('legal-documents')
@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: '법적 문서 조회' })
  async getDocument(@Param('slug') slug: string) {
    let doc = await this.prisma.legalDocument.findFirst({
      where: { slug },
    });

    if (!doc) {
      const defaultDoc = DEFAULT_DOCUMENTS[slug];
      if (defaultDoc) {
        doc = await this.prisma.legalDocument.create({
          data: {
            slug,
            title: defaultDoc.title,
            content: defaultDoc.content,
            version: 1,
            updatedBy: 'SYSTEM',
          },
        });
      } else {
        throw new NotFoundException(`Document with slug "${slug}" not found.`);
      }
    }

    const versions = await this.prisma.legalDocumentVersion.findMany({
      where: { documentSlug: slug },
      orderBy: { version: 'desc' },
      take: 20,
    });

    const history = versions.map((v) => ({
      version: v.version,
      title: v.title,
      body: v.content,
      memo: v.memo,
      updatedBy: v.updatedBy,
      updatedAt: v.createdAt ? v.createdAt.toISOString() : null,
    }));

    return {
      slug: doc.slug,
      title: doc.title,
      body: doc.content,
      version: doc.version,
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
      history,
    };
  }

  @Public()
  @Put(':slug')
  @ApiOperation({ summary: '법적 문서 수정 및 버전 저장' })
  async updateDocument(
    @Param('slug') slug: string,
    @Body() dto: UpdateLegalDocumentDto,
  ) {
    const existing = await this.prisma.legalDocument.findFirst({
      where: { slug },
    });

    const nextVersion = (existing?.version ?? 0) + 1;
    const updatedBy = dto.updatedBy || '관리자';

    const doc = await this.prisma.legalDocument.upsert({
      where: { slug },
      update: {
        title: dto.title,
        content: dto.body,
        version: nextVersion,
        updatedBy,
      },
      create: {
        slug,
        title: dto.title,
        content: dto.body,
        version: nextVersion,
        updatedBy,
      },
    });

    await this.prisma.legalDocumentVersion.create({
      data: {
        documentSlug: slug,
        version: nextVersion,
        title: dto.title,
        content: dto.body,
        memo: dto.memo || `v${nextVersion} 업데이트`,
        updatedBy,
      },
    });

    const versions = await this.prisma.legalDocumentVersion.findMany({
      where: { documentSlug: slug },
      orderBy: { version: 'desc' },
      take: 20,
    });

    const history = versions.map((v) => ({
      version: v.version,
      title: v.title,
      body: v.content,
      memo: v.memo,
      updatedBy: v.updatedBy,
      updatedAt: v.createdAt ? v.createdAt.toISOString() : null,
    }));

    return {
      ok: true,
      document: {
        slug: doc.slug,
        title: doc.title,
        body: doc.content,
        version: doc.version,
        updatedBy: doc.updatedBy,
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
      },
      history,
    };
  }
}
