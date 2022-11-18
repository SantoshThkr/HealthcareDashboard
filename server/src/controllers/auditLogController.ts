import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';

import { AuditLog, User } from '../models';
import { pageResult, paginate } from '../utils/pagination';

function startOfDay(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export async function list(req: Request, res: Response) {
  const { action, userId, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const pagination = paginate(req.query);
  const conditions: WhereOptions[] = [];

  if (action) {
    conditions.push({ action });
  }
  if (userId) {
    conditions.push({ userId: Number(userId) });
  }
  if (dateFrom) {
    conditions.push({ createdAt: { [Op.gte]: startOfDay(dateFrom) } });
  }
  if (dateTo) {
    const end = startOfDay(dateTo);
    end.setDate(end.getDate() + 1);
    conditions.push({ createdAt: { [Op.lt]: end } });
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where: { [Op.and]: conditions },
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}
