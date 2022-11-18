import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';

import { Doctor } from '../models';
import { recordAudit } from '../services/auditService';
import { ApiError } from '../utils/ApiError';
import { pageResult, paginate, sortOrder } from '../utils/pagination';

const SORT_COLUMNS = {
  id: ['id'],
  name: ['lastName', 'firstName'],
  specialization: ['specialization'],
  department: ['department'],
  status: ['status'],
};

const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'specialization',
  'department',
  'licenseNumber',
  'availability',
  'status',
] as const;

async function findDoctor(id: number): Promise<Doctor> {
  const doctor = await Doctor.findByPk(id);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }
  return doctor;
}

export async function list(req: Request, res: Response) {
  const { search, status, department } = req.query as Record<string, string | undefined>;
  const pagination = paginate(req.query);
  const where: WhereOptions = {};

  if (search) {
    const term = `%${search}%`;
    Object.assign(where, {
      [Op.or]: [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { specialization: { [Op.iLike]: term } },
        { licenseNumber: { [Op.iLike]: term } },
      ],
    });
  }
  if (status) {
    Object.assign(where, { status });
  }
  if (department) {
    Object.assign(where, { department });
  }

  const { rows, count } = await Doctor.findAndCountAll({
    where,
    order: sortOrder(req.query, SORT_COLUMNS, 'name'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}

export async function get(req: Request, res: Response) {
  const doctor = await findDoctor(Number(req.params.id));
  res.json({ success: true, data: doctor });
}

export async function create(req: Request, res: Response) {
  const doctor = await Doctor.create(pick(req.body));
  await recordAudit(req.user!.id, 'CREATE_DOCTOR', 'Doctor', doctor.id);
  res.status(201).json({ success: true, data: doctor });
}

export async function update(req: Request, res: Response) {
  const doctor = await findDoctor(Number(req.params.id));
  await doctor.update(pick(req.body));
  await recordAudit(req.user!.id, 'UPDATE_DOCTOR', 'Doctor', doctor.id);
  res.json({ success: true, data: doctor });
}

export async function remove(req: Request, res: Response) {
  const doctor = await findDoctor(Number(req.params.id));
  await doctor.destroy();
  await recordAudit(req.user!.id, 'DELETE_DOCTOR', 'Doctor', doctor.id);
  res.json({ success: true, data: null });
}

function pick(body: Record<string, unknown>) {
  const values: Record<string, unknown> = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      values[field] = body[field] === '' ? null : body[field];
    }
  });
  return values as Parameters<typeof Doctor.create>[0];
}
