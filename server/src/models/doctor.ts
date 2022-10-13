import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../config/database';

export const DOCTOR_STATUSES = ['ACTIVE', 'ON_LEAVE', 'INACTIVE'] as const;
export type DoctorStatus = typeof DOCTOR_STATUSES[number];

interface DoctorAttributes {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  availability: string | null;
  status: DoctorStatus;
}

type DoctorCreationAttributes = Optional<
  DoctorAttributes,
  'id' | 'userId' | 'availability' | 'status'
>;

export class Doctor
  extends Model<DoctorAttributes, DoctorCreationAttributes>
  implements DoctorAttributes
{
  declare id: number;
  declare userId: number | null;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare specialization: string;
  declare department: string;
  declare licenseNumber: string;
  declare availability: string | null;
  declare status: DoctorStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Doctor.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, unique: true },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    lastName: { type: DataTypes.STRING(50), allowNull: false },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      set(value: string) {
        this.setDataValue('email', value.trim().toLowerCase());
      },
    },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    specialization: { type: DataTypes.STRING(80), allowNull: false },
    department: { type: DataTypes.STRING(80), allowNull: false },
    licenseNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    availability: { type: DataTypes.STRING(120) },
    status: { type: DataTypes.ENUM(...DOCTOR_STATUSES), allowNull: false, defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'doctors', underscored: true }
);
