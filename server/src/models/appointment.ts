import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../config/database';

export const APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

interface AppointmentAttributes {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
}

type AppointmentCreationAttributes = Optional<AppointmentAttributes, 'id' | 'status' | 'notes'>;

export class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  declare id: number;
  declare patientId: number;
  declare doctorId: number;
  declare date: string;
  declare time: string;
  declare reason: string;
  declare status: AppointmentStatus;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
      get() {
        const value: string | null = this.getDataValue('time');
        return value ? value.slice(0, 5) : value;
      },
    },
    reason: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...APPOINTMENT_STATUSES),
      allowNull: false,
      defaultValue: 'SCHEDULED',
    },
    notes: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: 'appointments', underscored: true }
);
