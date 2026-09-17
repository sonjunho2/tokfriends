import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { buildDefaultActivityAccountSelection } from "../../common/activity-account-selection";

type DecodedJwtPayload = {
  sub?: string;
  tokenVersion?: unknown;
};

@Injectable()
export class AuthenticatedUserContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromPayload(payload: unknown) {
    const decodedPayload = payload as DecodedJwtPayload | null;
    if (!decodedPayload?.sub) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decodedPayload.sub },
      select: {
        id: true,
        role: true,
        status: true,
        tokenVersion: true,
        ownerBridge: {
          select: {
            id: true,
            status: true,
            activityAccounts: {
              ...buildDefaultActivityAccountSelection(decodedPayload.sub),
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user || user.status !== "active") {
      return null;
    }

    const tokenVersion =
      typeof decodedPayload.tokenVersion === "number"
        ? decodedPayload.tokenVersion
        : 0;

    if (user.tokenVersion !== tokenVersion) {
      return null;
    }

    const activeConsumerOwner =
      user.role === "user" && user.ownerBridge?.status === "active"
        ? user.ownerBridge
        : null;

    return {
      id: user.id,
      role: user.role,
      status: user.status,
      ownerId: activeConsumerOwner?.id ?? null,
      activityAccountId: activeConsumerOwner?.activityAccounts[0]?.id ?? null,
    };
  }
}
