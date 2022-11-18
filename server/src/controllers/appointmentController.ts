import { Request, Response } from 'express';
import { col, fn, Op, where as whereFn, WhereOptions } from 'sequelize';

import { Appointment, Doctor, Patient } from '../models';
import { AppointmentStatus } from '../models/appointment';
import { doctorIdFor } from '../services/accessService';
import { recordAudit } from '../services/auditService';
import {
  assertParticipants,
  assertSlotAvailable,
  assertTransition,
} from '../services/appointmentService';
import { ApiError } from '../utils/ApiError';
import { today } from '../utils/dates';
import { pageResult, paginate, sortOrder } from '../utils/pagination';

const SORT_COLUMNS = {
  date: ['date', 'time'],
  status: ['status'],
  id: ['id'],
};

const include = [
  { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
  { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
];

async function findAppointment(req: Request): Promise<Appointment> {
  const appointment = await Appointment.findByPk(Number(req.params.id), { include });
  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }
  if (req.user!.role === 'DOCTOR' && appointment.doctorId !== doctorIdFor(req.user!)) {
    throw ApiError.forbidden('This appointment is not assigned to you');
  }
  return appointment;
}

export async function list(req: Request, res: Response) {
  const { search, status, doctorId, patientId, date, dateFrom, dateTo } = req.query as Record<
    string,
    string | undefined
  >;
  const pagination = paginate(req.query);
  const conditions: WhereOptions[] = [];

  if (req.user!.role === 'DOCTOR') {
    conditions.push({ doctorId: doctorIdFor(req.user!) });
  } else if (doctorId) {
    conditions.push({ doctorId: Number(doctorId) });
  }
  if (patientId) {
    conditions.push({ patientId: Number(patientId) });
  }
  if (status) {
    conditions.push({ status });
  }
  if (date) {
    conditions.push({ date });
  }
  if (dateFrom) {
    conditions.push({ date: { [Op.gte]: dateFrom } });
  }
  if (dateTo) {
    conditions.push({ date: { [Op.lte]: dateTo } });
  }
  if (search) {
    const term = `%${search}%`;
    conditions.push({
      [Op.or]: [
        whereFn(fn('concat', col('patient.first_name'), ' ', col('patient.last_name')), {
          [Op.iLike]: term,
        }),
        { reason: { [Op.iLike]: term } },
      ],
    });
  }

  const { rows, count } = await Appointment.findAndCountAll({
    where: { [Op.and]: conditions },
    include,
    order: sortOrder(req.query, SORT_COLUMNS, 'date', 'DESC'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}

export async function get(req: Request, res: Response) {
  res.json({ success: true, data: await findAppointment(req) });
}

export async function create(req: Request, res: Response) {
  const { patientId, doctorId, date, time, reason, notes } = req.body;

  await assertParticipants(patientId, doctorId);
  await assertSlotAvailable(doctorId, date, time);

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    date,
    time,
    reason,
    notes: notes || null,
  });
  await recordAudit(req.user!.id, 'CREATE_APPOINTMENT', 'Appointment', appointment.id);
  await appointment.reload({ include });
  res.status(201).json({ success: true, data: appointment });
}

export async function update(req: Request, res: Response) {
  const appointment = await findAppointment(req);
  const status: AppointmentStatus = req.body.status || appointment.status;
  const changes: Partial<Appointment> = {};

  assertTransition(appointment.status, status);
  changes.status = status;
  if (req.body.notes !== undefined) {
    changes.notes = req.body.notes || null;
  }

  if (req.user!.role !== 'DOCTOR') {
    const patientId = req.body.patientId ?? appointment.patientId;
    const doctorId = req.body.doctorId ?? appointment.doctorId;
    const date = req.body.date ?? appointment.date;
    const time = req.body.time ?? appointment.time;
    const reschedule =
      patientId !== appointment.patientId ||
      doctorId !== appointment.doctorId ||
      date !== appointment.date ||
      time !== appointment.time;

    if (reschedule) {
      if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
        throw ApiError.conflict('Completed or cancelled appointments cannot be rescheduled');
      }
      if (date < today()) {
        throw ApiError.badRequest('Validation failed', { date: 'Date cannot be in the past' });
      }
      await assertParticipants(patientId, doctorId);
      await assertSlotAvailable(doctorId, date, time, appointment.id);
    }

    Object.assign(changes, { patientId, doctorId, date, time });
    if (req.body.reason !== undefined) {
      changes.reason = req.body.reason;
    }
  }

  const cancelled = status === 'CANCELLED' && appointment.status !== 'CANCELLED';
  await appointment.update(changes);
  await recordAudit(
    req.user!.id,
    cancelled ? 'CANCEL_APPOINTMENT' : 'UPDATE_APPOINTMENT',
    'Appointment',
    appointment.id
  );
  await appointment.reload({ include });
  res.json({ success: true, data: appointment });
}

export async function remove(req: Request, res: Response) {
  const appointment = await findAppointment(req);
  await appointment.destroy();
  await recordAudit(req.user!.id, 'DELETE_APPOINTMENT', 'Appointment', appointment.id);
  res.json({ success: true, data: null });
}
