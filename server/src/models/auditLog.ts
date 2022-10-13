import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../config/database';

export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_PATIENT',
  'UPDATE_PATIENT',
  'DELETE_PATIENT',
  'CREATE_DOCTOR',
  'UPDATE_DOCTOR',
  'DELETE_DOCTOR',
  'CREATE_APPOINTMENT',
  'UPDATE_APPOINTMENT',
  'CANCEL_APPOINTMENT',
  'DELETE_APPOINTMENT',
  'CREATE_MEDICAL_RECORD',
  'UPDATE_MEDICAL_RECORD',
  'CREATE_USER',
  'UPDATE_USER',
] as const;
export type AuditAction = typeof AUDIT_ACTIONS[number];

interface AuditLogAttributes {
  id: number;
  userId: number | null;
  action: AuditAction;
  entity: string;
  entityId: number | null;
  createdAt: Date;
}

type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id' | 'entityId' | 'createdAt'>;

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: number;
  declare userId: number | null;
  declare action: AuditAction;
  declare entity: string;
  declare entityId: number | null;
  declare createdAt: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING(50), allowNull: false },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    entityId: { type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'audit_logs', underscored: true, updatedAt: false }
);
