import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, AdminApprovalStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

type AuditInput = {
  actorId?: string | null;
  target: string;
  action: string;
  notes?: string | null;
  reason?: string | null;
  context?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

type ApprovalRequestInput = {
  requestedById: string;
  action: string;
  target: string;
  reason: string;
  context?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  idempotencyKey?: string;
  expiresAt?: Date;
};

@Injectable()
export class AdminSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAudit(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        target: input.target,
        action: input.action,
        notes: input.notes ?? null,
        reason: input.reason ?? null,
        context: input.context,
        metadata: input.metadata,
      },
    });
  }

  async requestApproval(input: ApprovalRequestInput) {
    const reason = input.reason?.trim();

    if (!reason) {
      throw new BadRequestException('Approval reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = input.idempotencyKey
        ? await tx.adminApprovalRequest.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          })
        : null;

      if (existing) {
        return existing;
      }

      const request = await tx.adminApprovalRequest.create({
        data: {
          requestedById: input.requestedById,
          action: input.action,
          target: input.target,
          reason,
          context: input.context,
          metadata: input.metadata,
          idempotencyKey: input.idempotencyKey,
          expiresAt: input.expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: input.requestedById,
          target: `admin-approval:${request.id}`,
          action: 'ADMIN_APPROVAL_REQUESTED',
          reason,
          context: {
            requestedAction: input.action,
            requestedTarget: input.target,
          },
          metadata: input.metadata,
        },
      });

      return request;
    });
  }

  async decideApproval(
    requestId: string,
    decidedById: string,
    decision: Extract<
      AdminApprovalStatus,
      'APPROVED' | 'REJECTED'
    >,
    decisionReason?: string,
  ) {
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.adminApprovalRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Approval request not found');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('Approval request is not pending');
      }

      if (request.requestedById === decidedById) {
        throw new ForbiddenException(
          'Requester cannot approve or reject their own request',
        );
      }

      if (request.expiresAt && request.expiresAt <= now) {
        const cancelled = await tx.adminApprovalRequest.updateMany({
          where: {
            id: request.id,
            status: 'PENDING',
          },
          data: {
            status: 'CANCELLED',
            decidedAt: now,
            decisionReason: 'expired',
          },
        });

        if (cancelled.count !== 1) {
          throw new BadRequestException('Approval request is no longer pending');
        }

        await tx.auditLog.create({
          data: {
            actorId: decidedById,
            target: `admin-approval:${request.id}`,
            action: 'ADMIN_APPROVAL_EXPIRED',
            reason: 'expired',
            context: {
              requestedAction: request.action,
              requestedTarget: request.target,
              requestedById: request.requestedById,
            },
          },
        });

        return { expired: true as const, updated: null };
      }

      const updatedCount = await tx.adminApprovalRequest.updateMany({
        where: {
          id: request.id,
          status: 'PENDING',
        },
        data: {
          status: decision,
          decidedById,
          decisionReason: decisionReason?.trim() || null,
          decidedAt: now,
        },
      });

      if (updatedCount.count !== 1) {
        throw new BadRequestException('Approval request is no longer pending');
      }

      await tx.auditLog.create({
        data: {
          actorId: decidedById,
          target: `admin-approval:${request.id}`,
          action:
            decision === 'APPROVED'
              ? 'ADMIN_APPROVAL_APPROVED'
              : 'ADMIN_APPROVAL_REJECTED',
          reason: decisionReason?.trim() || null,
          context: {
            requestedAction: request.action,
            requestedTarget: request.target,
            requestedById: request.requestedById,
          },
        },
      });

      const updated = await tx.adminApprovalRequest.findUniqueOrThrow({
        where: { id: request.id },
      });

      return { expired: false as const, updated };
    });

    if (result.expired) {
      throw new BadRequestException('Approval request has expired');
    }

    return result.updated;
  }

  async listApprovals(status?: AdminApprovalStatus) {
    return this.prisma.adminApprovalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        requestedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        decidedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }
}