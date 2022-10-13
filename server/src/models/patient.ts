import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../config/database';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type Gender = typeof GENDERS[number];
export type PatientStatus = typeof PATIENT_STATUSES[number];

interface PatientAttributes {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  doctorId: number | null;
  status: PatientStatus;
}

type PatientCreationAttributes = Optional<
  PatientAttributes,
  | 'id'
  | 'email'
  | 'address'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'doctorId'
  | 'status'
>;

export class Patient
  extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes
{
  declare id: number;
  declare firstName: string;
  declare lastName: string;
  declare dateOfBirth: string;
  declare gender: Gender;
  declare phone: string;
  declare email: string | null;
  declare address: string | null;
  declare emergencyContactName: string | null;
  declare emergencyContactPhone: string | null;
  declare doctorId: number | null;
  declare status: PatientStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Patient.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    lastName: { type: DataTypes.STRING(50), allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    gender: { type: DataTypes.ENUM(...GENDERS), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(120) },
    address: { type: DataTypes.STRING(255) },
    emergencyContactName: { type: DataTypes.STRING(100) },
    emergencyContactPhone: { type: DataTypes.STRING(20) },
    doctorId: { type: DataTypes.INTEGER },
    status: { type: DataTypes.ENUM(...PATIENT_STATUSES), allowNull: false, defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'patients', underscored: true }
);
