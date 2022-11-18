import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';

import { Doctor, sequelize, User } from '../models';
import { recordAudit } from '../services/auditService';
import { syncDoctorProfile } from '../services/userService';
import { ApiError } from '../utils/ApiError';
import { pageResult, paginate, sortOrder } from '../utils/pagination';
import { BCRYPT_ROUNDS } from './authController';

const SORT_COLUMNS = {
  name: ['lastName', 'firstName'],
  email: ['email'],
  role: ['role'],
  createdAt: ['createdAt'],
};

const doctorInclude = {
  model: Doctor,
  as: 'doctorProfile',
  attributes: ['id', 'firstName', 'lastName'],
};

export async function list(req: Request, res: Response) {
  const { search, role, isActive } = req.query as Record<string, string | undefined>;
  const pagination = paginate(req.query);
  const where: WhereOptions = {};

  if (search) {
    const term = `%${search}%`;
    Object.assign(where, {
      [Op.or]: [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ],
    });
  }
  if (role) {
    Object.assign(where, { role });
  }
  if (isActive !== undefined) {
    Object.assign(where, { isActive: isActive === 'true' });
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [doctorInclude],
    order: sortOrder(req.query, SORT_COLUMNS, 'createdAt', 'DESC'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({ success: true, data: pageResult(rows, count, pagination) });
}

export async function create(req: Request, res: Response) {
  const { firstName, lastName, email, password, role, isActive, doctorId } = req.body;

  if (await User.findOne({ where: { email } })) {
    throw ApiError.badRequest('Validation failed', { email: 'This email is already registered' });
  }

  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create(
      {
        firstName,
        lastName,
        email,
        role,
        isActive: isActive ?? true,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
      { transaction }
    );
    await syncDoctorProfile(created, doctorId, transaction);
    return created;
  });

  await recordAudit(req.user!.id, 'CREATE_USER', 'User', user.id);
  await user.reload({ include: [doctorInclude] });
  res.status(201).json({ success: true, data: user });
}

export async function update(req: Request, res: Response) {
  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { firstName, lastName, email, password, role, isActive, doctorId } = req.body;
  const isSelf = user.id === req.user!.id;

  if (isSelf && role !== undefined && role !== user.role) {
    throw ApiError.forbidden('You cannot change your own role');
  }
  if (isSelf && isActive === false) {
    throw ApiError.forbidden('You cannot deactivate your own account');
  }
  if (email && email !== user.email && (await User.findOne({ where: { email } }))) {
    throw ApiError.badRequest('Validation failed', { email: 'This email is already registered' });
  }

  await sequelize.transaction(async (transaction) => {
    const changes: Partial<User> = {};
    if (firstName !== undefined) changes.firstName = firstName;
    if (lastName !== undefined) changes.lastName = lastName;
    if (email !== undefined) changes.email = email;
    if (role !== undefined) changes.role = role;
    if (isActive !== undefined) changes.isActive = isActive;
    if (password) changes.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await user.update(changes, { transaction });
    await syncDoctorProfile(user, doctorId, transaction);
  });
  await recordAudit(req.user!.id, 'UPDATE_USER', 'User', user.id);

  await user.reload({ include: [doctorInclude] });
  res.json({ success: true, data: user });
}
