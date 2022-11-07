import { Request, Response } from 'express';
import { col, fn, Op, where as whereFn, WhereOptions } from 'sequelize';

import { Doctor, Patient } from '../models';
import { doctorIdFor, doctorPatientScope, findAccessiblePatient } from '../services/accessService';
import { ApiError } from '../utils/ApiError';
import { pageResult, paginate, sortOrder } from '../utils/pagination';

const SORT_COLUMNS = {
  id: ['id'],
  name: ['lastName', 'firstName'],
  dateOfBirth: ['dateOfBirth'],
  status: ['status'],
  createdAt: ['createdAt'],
};

const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'phone',
  'email',
  'address',
  'emergencyContactName',
  'emergencyContactPhone',
  'doctorId',
  'status',
] as const;

const doctorInclude = {
  model: Doctor,
  as: 'doctor',
  attributes: ['id', 'firstName', 'lastName', 'specialization'],
};

export async function list(req: Request, res: Response) {
  const { search, status, doctorId } = req.query as Record<string, string | undefined>;
  const pagination = paginate(req.query);
  const conditions: WhereOptions[] = [];

  if (req.user!.role === 'DOCTOR') {
    conditions.push(await doctorPatientScope(doctorIdFor(req.user!)));
  }
  if (search) {
    const term = `%${search}%`;
    const matches: WhereOptions[] = [
      whereFn(fn('concat', col('Patient.first_name'), ' ', col('Patient.last_name')), {
        [Op.iLike]: term,
      }),
      { email: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
    ];
    if (/^\d+$/.test(search)) {
      matches.push({ id: Number(search) });
    }
    conditions.push({ [Op.or]: matches });
  }
  if (status) {
    conditions.push({ status });
  }
  if (doctorId) {
    conditions.push({ doctorId: Number(doctorId) });
  }

  const { rows, count } = await Patient.findAndCountAll({
    where: { [Op.and]: conditions },
    include: [doctorInclude],
    order: sortOrder(req.query, SORT_COLUMNS, 'name'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}

export async function get(req: Request, res: Response) {
  const patient = await findAccessiblePatient(req.user!, Number(req.params.id));
  await patient.reload({ include: [doctorInclude] });
  res.json({ success: true, data: patient });
}

export async function create(req: Request, res: Response) {
  const values = await pickValidated(req.body);
  const patient = await Patient.create(values);
  await patient.reload({ include: [doctorInclude] });
  res.status(201).json({ success: true, data: patient });
}

export async function update(req: Request, res: Response) {
  const patient = await Patient.findByPk(Number(req.params.id));
  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }
  await patient.update(await pickValidated(req.body));
  await patient.reload({ include: [doctorInclude] });
  res.json({ success: true, data: patient });
}

export async function remove(req: Request, res: Response) {
  const patient = await Patient.findByPk(Number(req.params.id));
  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }
  await patient.destroy();
  res.json({ success: true, data: null });
}

async function pickValidated(body: Record<string, unknown>) {
  const values: Record<string, unknown> = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      values[field] = body[field] === '' ? null : body[field];
    }
  });

  if (values.doctorId && !(await Doctor.findByPk(values.doctorId as number))) {
    throw ApiError.badRequest('Validation failed', { doctorId: 'Selected doctor does not exist' });
  }
  return values as Parameters<typeof Patient.create>[0];
}
