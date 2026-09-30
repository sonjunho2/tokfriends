import { Prisma } from "@prisma/client";

type DefaultActivityAccountSelection = {
  where: Prisma.ActivityAccountWhereInput;
  orderBy: Prisma.ActivityAccountOrderByWithRelationInput[];
};

type DefaultActivityAccountCandidate = {
  status: string;
  isPrimary: boolean;
  legacyUserId: string | null;
};

export function buildDefaultActivityAccountOrderBy(): Prisma.ActivityAccountOrderByWithRelationInput[] {
  return [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }];
}

export function isDefaultActivityAccountCandidate(
  account: DefaultActivityAccountCandidate,
  legacyUserId: string,
): boolean {
  return (
    account.status === "active" &&
    (account.isPrimary || account.legacyUserId === legacyUserId)
  );
}

export function buildDefaultActivityAccountSelection(
  legacyUserId: string,
): DefaultActivityAccountSelection {
  return {
    where: {
      status: "active",
      OR: [{ isPrimary: true }, { legacyUserId }],
    },
    orderBy: buildDefaultActivityAccountOrderBy(),
  };
}
