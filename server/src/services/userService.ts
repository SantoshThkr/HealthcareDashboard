import { Transaction } from 'sequelize';

import { Doctor, User } from '../models';
import { ApiError } from '../utils/ApiError';

export async function syncDoctorProfile(
  user: User,
  doctorId: number | null | undefined,
  transaction: Transaction
): Promise<void> {
  const current = await Doctor.findOne({ where: { userId: user.id }, transaction });

  if (user.role !== 'DOCTOR') {
    if (current) {
      await current.update({ userId: null }, { transaction });
    }
    return;
  }

  if (doctorId === undefined || doctorId === current?.id) {
    return;
  }

  if (current) {
    await current.update({ userId: null }, { transaction });
  }
  if (doctorId === null) {
    return;
  }

  const doctor = await Doctor.findByPk(doctorId, { transaction });
  if (!doctor) {
    throw ApiError.badRequest('Validation failed', { doctorId: 'Doctor profile not found' });
  }
  if (doctor.userId && doctor.userId !== user.id) {
    throw ApiError.badRequest('Validation failed', {
      doctorId: 'This doctor profile is already linked to another user',
    });
  }
  await doctor.update({ userId: user.id }, { transaction });
}
