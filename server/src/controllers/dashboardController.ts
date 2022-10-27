import { Request, Response } from 'express';

import * as dashboardService from '../services/dashboardService';

export async function summary(req: Request, res: Response) {
  const data = await dashboardService.getSummary(req.user!);
  res.json({ success: true, data });
}

export async function recentActivity(_req: Request, res: Response) {
  const data = await dashboardService.getRecentActivity();
  res.json({ success: true, data });
}
