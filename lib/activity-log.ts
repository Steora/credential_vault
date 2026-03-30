import { ActivityAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogActivityParams = {
  actorId: string;
  action: ActivityAction;
  /** e.g. project | note | secret | user | project_member | sharing_secret | sharing_note */
  entityType: string;
  entityId?: string | null;
  label?: string | null;
};

/**
 * Persists an audit row. Errors are swallowed so mutations never fail because logging failed.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId:    params.actorId,
        action:     params.action,
        entityType: params.entityType,
        entityId:   params.entityId ?? undefined,
        label:      params.label ?? undefined,
      },
    });
  } catch (err) {
    console.error("[activity-log]", err);
  }
}
