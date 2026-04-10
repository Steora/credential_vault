import { prisma } from "@/lib/prisma";

/** Items per page on the activity dashboard. */
export const ACTIVITY_PAGE_SIZE = 10;

/**
 * Returns one page of activity logs (newest first) and total count.
 * `requestedPage` is clamped to a valid range when there are rows.
 */
export async function getActivityLogsPage(requestedPage: number) {
  const pageSize = ACTIVITY_PAGE_SIZE;
  const total = await prisma.activityLog.count();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage)), totalPages);
  const skip = (page - 1) * pageSize;

  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return { rows, total, page, pageSize, totalPages };
}

export type ActivityLogsPageResult = Awaited<ReturnType<typeof getActivityLogsPage>>;
