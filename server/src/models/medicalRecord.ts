import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../config/database';

interface MedicalRecordAttributes {
  id: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  diagnosis: string;
  symptoms: string | null;
  prescription: string | null;
  notes: string | null;
  followUpDate: string | null;
}

type MedicalRecordCreationAttributes = Optional<
  MedicalRecordAttributes,
  'id' | 'symptoms' | 'prescription' | 'notes' | 'followUpDate'
>;

export class MedicalRecord
  extends Model<MedicalRecordAttributes, MedicalRecordCreationAttributes>
  implements MedicalRecordAttributes
{
  declare id: number;
  declare patientId: number;
  declare doctorId: number;
  declare visitDate: string;
  declare diagnosis: string;
  declare symptoms: string | null;
  declare prescription: string | null;
  declare notes: string | null;
  declare followUpDate: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MedicalRecord.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    visitDate: { type: DataTypes.DATEONLY, allowNull: false },
    diagnosis: { type: DataTypes.STRING(255), allowNull: false },
    symptoms: { type: DataTypes.TEXT },
    prescription: { type: DataTypes.TEXT },
    notes: { type: DataTypes.TEXT },
    followUpDate: { type: DataTypes.DATEONLY },
  },
  { sequelize, tableName: 'medical_records', underscored: true }
);
