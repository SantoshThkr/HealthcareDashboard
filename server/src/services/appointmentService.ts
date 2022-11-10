import { Op } from 'sequelize';

import { Appointment, Doctor, Patient } from '../models';
import { AppointmentStatus } from '../models/appointment';
import { ApiError, FieldErrors } from '../utils/ApiError';

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransition(from, to)) {
    throw ApiError.conflict(
      `An appointment cannot be moved from ${from.toLowerCase()} to ${to.toLowerCase()}`
    );
  }
}

export async function assertParticipants(patientId: number, doctorId: number): Promise<void> {
  const [patient, doctor] = await Promise.all([
    Patient.findByPk(patientId),
    Doctor.findByPk(doctorId),
  ]);
  const errors: FieldErrors = {};

  if (!patient) {
    errors.patientId = 'Selected patient does not exist';
  } else if (patient.status !== 'ACTIVE') {
    errors.patientId = 'Selected patient is inactive';
  }
  if (!doctor) {
    errors.doctorId = 'Selected doctor does not exist';
  } else if (doctor.status !== 'ACTIVE') {
    errors.doctorId = 'Selected doctor is not currently available';
  }

  if (Object.keys(errors).length) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

export async function assertSlotAvailable(
  doctorId: number,
  date: string,
  time: string,
  excludeId?: number
): Promise<void> {
  const clash = await Appointment.findOne({
    where: {
      doctorId,
      date,
      time,
      status: { [Op.ne]: 'CANCELLED' },
      ...(excludeId && { id: { [Op.ne]: excludeId } }),
    },
  });
  if (clash) {
    throw ApiError.conflict('The doctor already has an appointment at this time');
  }
}
