import { Op, WhereOptions } from 'sequelize';

import { Appointment, AuditLog, Doctor, Patient, User } from '../models';
import { AppointmentStatus, APPOINTMENT_STATUSES } from '../models/appointment';
import { AuditAction } from '../models/auditLog';
import { today } from '../utils/dates';
import { doctorIdFor, doctorPatientScope } from './accessService';

const PENDING_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];

const appointmentListOptions = {
  include: [
    { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
    { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
  ],
  order: [
    ['date', 'ASC'],
    ['time', 'ASC'],
  ] as [string, string][],
};

export async function getSummary(user: User) {
  const date = today();
  let appointmentScope: WhereOptions = {};
  let patientScope: WhereOptions = {};

  if (user.role === 'DOCTOR') {
    const doctorId = doctorIdFor(user);
    appointmentScope = { doctorId };
    patientScope = await doctorPatientScope(doctorId);
  }

  const [totalPatients, totalDoctors, statusCounts, todayCount, upcomingCount] = await Promise.all([
    Patient.count({ where: { ...patientScope, status: 'ACTIVE' } }),
    Doctor.count({ where: { status: { [Op.ne]: 'INACTIVE' } } }),
    Appointment.count({ where: appointmentScope, group: ['status'] }),
    Appointment.count({ where: { ...appointmentScope, date } }),
    Appointment.count({
      where: { ...appointmentScope, date: { [Op.gt]: date }, status: PENDING_STATUSES },
    }),
  ]);

  const byStatus = APPOINTMENT_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<AppointmentStatus, number>);
  (statusCounts as unknown as { status: AppointmentStatus; count: number }[]).forEach((row) => {
    byStatus[row.status] = Number(row.count);
  });

  const [todayAppointments, upcomingAppointments] = await Promise.all([
    Appointment.findAll({ ...appointmentListOptions, where: { ...appointmentScope, date } }),
    Appointment.findAll({
      ...appointmentListOptions,
      where: { ...appointmentScope, date: { [Op.gt]: date }, status: PENDING_STATUSES },
      limit: 5,
    }),
  ]);

  return {
    totals: {
      patients: totalPatients,
      doctors: totalDoctors,
      todayAppointments: todayCount,
      pendingAppointments: byStatus.SCHEDULED + byStatus.CONFIRMED,
      completedAppointments: byStatus.COMPLETED,
    },
    appointmentSummary: {
      today: todayCount,
      upcoming: upcomingCount,
      completed: byStatus.COMPLETED,
      cancelled: byStatus.CANCELLED,
    },
    appointmentsByStatus: byStatus,
    todayAppointments,
    upcomingAppointments,
  };
}

const ACTIVITY_TEXT: Partial<Record<AuditAction, string>> = {
  CREATE_PATIENT: 'registered a new patient',
  UPDATE_PATIENT: 'updated a patient record',
  DELETE_PATIENT: 'removed a patient',
  CREATE_DOCTOR: 'added a doctor',
  UPDATE_DOCTOR: 'updated a doctor profile',
  CREATE_APPOINTMENT: 'created an appointment',
  UPDATE_APPOINTMENT: 'updated an appointment',
  CANCEL_APPOINTMENT: 'cancelled an appointment',
  DELETE_APPOINTMENT: 'deleted an appointment',
  CREATE_MEDICAL_RECORD: 'added a medical record',
  UPDATE_MEDICAL_RECORD: 'updated a medical record',
  CREATE_USER: 'created a user account',
  UPDATE_USER: 'updated a user account',
};

function displayName(user?: User | null): string {
  if (!user) {
    return 'A former user';
  }
  return user.role === 'DOCTOR' ? `Dr. ${user.lastName}` : `${user.firstName} ${user.lastName}`;
}

export async function getRecentActivity(limit = 10) {
  const logs = await AuditLog.findAll({
    where: { action: Object.keys(ACTIVITY_TEXT) },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit,
  });

  return logs.map((log) => {
    const user = (log as AuditLog & { user?: User }).user;
    return {
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      createdAt: log.createdAt,
      description: `${displayName(user)} ${ACTIVITY_TEXT[log.action]}`,
    };
  });
}
