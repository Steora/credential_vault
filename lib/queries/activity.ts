import { prisma } from "@/lib/prisma";

const PAGE = 100;

export async function getActivityLogs() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take:    PAGE,
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
