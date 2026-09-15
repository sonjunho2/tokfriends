import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "nestjs-prisma";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
              where: {
                status: "active",
                OR: [{ isPrimary: true }, { legacyUserId: payload.sub }],
              },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
      typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0;

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
