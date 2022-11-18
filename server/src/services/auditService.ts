import { AuditLog } from '../models';
import { AuditAction } from '../models/auditLog';
import { logger } from '../utils/logger';

export async function recordAudit(
  userId: number | null,
  action: AuditAction,
  entity: string,
  entityId: number | null = null
): Promise<void> {
  try {
    await AuditLog.create({ userId, action, entity, entityId });
  } catch (err) {
    logger.error(`Failed to write audit log ${action}: ${(err as Error).message}`);
  }
}
