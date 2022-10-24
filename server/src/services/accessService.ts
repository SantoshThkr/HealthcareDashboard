import { Op, WhereOptions } from 'sequelize';

import { Appointment, Patient, User } from '../models';
import { ApiError } from '../utils/ApiError';

export function doctorIdFor(user: User): number {
  if (!user.doctorProfile) {
    throw ApiError.forbidden('Your account is not linked to a doctor profile');
  }
  return user.doctorProfile.id;
}

// A doctor can see patients assigned to them and anyone they have an appointment with.
export async function doctorPatientScope(doctorId: number): Promise<WhereOptions> {
  const appointments = await Appointment.findAll({
    where: { doctorId },
    attributes: ['patientId'],
    group: ['patientId'],
    raw: true,
  });
  const ids = appointments.map((appointment) => appointment.patientId);
  return { [Op.or]: [{ doctorId }, { id: { [Op.in]: ids } }] };
}

export async function findAccessiblePatient(user: User, patientId: number): Promise<Patient> {
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }

  if (user.role === 'DOCTOR') {
    const doctorId = doctorIdFor(user);
    if (patient.doctorId !== doctorId) {
      const appointment = await Appointment.findOne({ where: { doctorId, patientId } });
      if (!appointment) {
        throw ApiError.forbidden('This patient is not assigned to you');
      }
    }
  }

  return patient;
}
