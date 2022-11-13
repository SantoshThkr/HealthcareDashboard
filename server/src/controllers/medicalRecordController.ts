import { Request, Response } from 'express';
import { col, fn, Op, where as whereFn, WhereOptions } from 'sequelize';

import { Doctor, MedicalRecord, Patient } from '../models';
import { doctorIdFor, doctorPatientScope, findAccessiblePatient } from '../services/accessService';
import { ApiError } from '../utils/ApiError';
import { pageResult, paginate, sortOrder } from '../utils/pagination';

const SORT_COLUMNS = {
  visitDate: ['visitDate', 'id'],
  id: ['id'],
};

const doctorInclude = { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] };

function recordValues(body: Record<string, string | null | undefined>) {
  return {
    visitDate: body.visitDate as string,
    diagnosis: body.diagnosis as string,
    symptoms: body.symptoms || null,
    prescription: body.prescription || null,
    notes: body.notes || null,
    followUpDate: body.followUpDate || null,
  };
}

export async function list(req: Request, res: Response) {
  const { search, patientId } = req.query as Record<string, string | undefined>;
  const pagination = paginate(req.query);
  const conditions: WhereOptions[] = [];
  let patientScope: WhereOptions = {};

  if (req.user!.role === 'DOCTOR') {
    patientScope = await doctorPatientScope(doctorIdFor(req.user!));
  }
  if (patientId) {
    conditions.push({ patientId: Number(patientId) });
  }
  if (search) {
    const term = `%${search}%`;
    conditions.push({
      [Op.or]: [
        { diagnosis: { [Op.iLike]: term } },
        whereFn(fn('concat', col('patient.first_name'), ' ', col('patient.last_name')), {
          [Op.iLike]: term,
        }),
      ],
    });
  }

  const { rows, count } = await MedicalRecord.findAndCountAll({
    where: { [Op.and]: conditions },
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName'],
        where: patientScope,
        required: true,
      },
      doctorInclude,
    ],
    order: sortOrder(req.query, SORT_COLUMNS, 'visitDate', 'DESC'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}

export async function listForPatient(req: Request, res: Response) {
  const patient = await findAccessiblePatient(req.user!, Number(req.params.id));
  const records = await MedicalRecord.findAll({
    where: { patientId: patient.id },
    include: [doctorInclude],
    order: [
      ['visitDate', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  res.json({ success: true, data: records });
}

export async function get(req: Request, res: Response) {
  const record = await MedicalRecord.findByPk(Number(req.params.id), {
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
      doctorInclude,
    ],
  });
  if (!record) {
    throw ApiError.notFound('Medical record not found');
  }
  await findAccessiblePatient(req.user!, record.patientId);
  res.json({ success: true, data: record });
}

export async function create(req: Request, res: Response) {
  const patient = await findAccessiblePatient(req.user!, Number(req.params.id));
  const record = await MedicalRecord.create({
    ...recordValues(req.body),
    patientId: patient.id,
    doctorId: doctorIdFor(req.user!),
  });
  await record.reload({ include: [doctorInclude] });
  res.status(201).json({ success: true, data: record });
}

export async function update(req: Request, res: Response) {
  const record = await MedicalRecord.findByPk(Number(req.params.id));
  if (!record) {
    throw ApiError.notFound('Medical record not found');
  }
  if (record.doctorId !== doctorIdFor(req.user!)) {
    throw ApiError.forbidden('Only the doctor who created this record can update it');
  }
  await record.update(recordValues(req.body));
  await record.reload({ include: [doctorInclude] });
  res.json({ success: true, data: record });
}
