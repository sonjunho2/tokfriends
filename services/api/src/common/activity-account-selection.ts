import { Prisma } from "@prisma/client";

type DefaultActivityAccountSelection = {
  where: Prisma.ActivityAccountWhereInput;
  orderBy: Prisma.ActivityAccountOrderByWithRelationInput[];
};

export function buildDefaultActivityAccountSelection(
  legacyUserId: string,
): DefaultActivityAccountSelection {
  return {
    where: {
      status: "active",
      OR: [{ isPrimary: true }, { legacyUserId }],
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }],
  };
}
