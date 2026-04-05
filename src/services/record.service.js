import { eq, and, or, gte, lte, ilike, desc, asc, count, isNull } from 'drizzle-orm';
import { db } from '../config/db.js';
import { financialRecords, auditLogs } from '../db/schema.js';
import { AppError } from '../utils/AppError.js';

const buildConditions = (filters) => {
  const conditions = [isNull(financialRecords.deletedAt)];

  if (filters.type)     conditions.push(eq(financialRecords.type, filters.type));
  if (filters.category) conditions.push(eq(financialRecords.category, filters.category));
  if (filters.from)     conditions.push(gte(financialRecords.date, filters.from));
  if (filters.to)       conditions.push(lte(financialRecords.date, filters.to));
  if (filters.search) {
    conditions.push(
      or(
        ilike(financialRecords.notes, `%${filters.search}%`),
        ilike(financialRecords.category, `%${filters.search}%`)
      )
    );
  }

  return and(...conditions);
};

const buildOrderClause = (sortBy, order) => {
  if (!sortBy) return desc(financialRecords.date);
  const column = financialRecords[sortBy];
  return order === 'desc' ? desc(column) : asc(column);
};

export const getRecords = async (filters, pagination) => {
  const { page, limit, sortBy, order } = pagination;
  const offset = (page - 1) * limit;
  const where = buildConditions(filters);

  const [records, [{ total }]] = await Promise.all([
    db.select()
      .from(financialRecords)
      .where(where)
      .orderBy(buildOrderClause(sortBy, order))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() })
      .from(financialRecords)
      .where(where),
  ]);

  return { records, total };
};

export const getRecordById = async (id) => {
  const [record] = await db.select()
    .from(financialRecords)
    .where(and(eq(financialRecords.id, id), isNull(financialRecords.deletedAt)));

  if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

  return record;
};

export const createRecord = async (data, userId) => {
  const [record] = await db.insert(financialRecords)
    .values({ ...data, amount: String(data.amount), createdBy: userId, updatedAt: new Date() })
    .returning();

  await db.insert(auditLogs)
    .values({ recordId: record.id, changedBy: userId, action: 'INSERT', oldValues: null, newValues: record })
    .catch((err) => console.error('Audit log failed:', err));

  return record;
};

export const updateRecord = async (id, data, userId) => {
  const [oldRecord] = await db.select()
    .from(financialRecords)
    .where(and(eq(financialRecords.id, id), isNull(financialRecords.deletedAt)));

  if (!oldRecord) throw new AppError('Record not found', 404, 'NOT_FOUND');

  const [updatedRecord] = await db.update(financialRecords)
    .set({
      ...data,
      ...(data.amount !== undefined && { amount: String(data.amount) }),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(financialRecords.id, id))
    .returning();

  await db.insert(auditLogs)
    .values({ recordId: id, changedBy: userId, action: 'UPDATE', oldValues: oldRecord, newValues: updatedRecord })
    .catch((err) => console.error('Audit log failed:', err));

  return updatedRecord;
};

export const softDeleteRecord = async (id, userId) => {
  const [oldRecord] = await db.select()
    .from(financialRecords)
    .where(and(eq(financialRecords.id, id), isNull(financialRecords.deletedAt)));

  if (!oldRecord) throw new AppError('Record not found', 404, 'NOT_FOUND');

  await db.update(financialRecords)
    .set({ deletedAt: new Date(), updatedBy: userId })
    .where(eq(financialRecords.id, id));

  await db.insert(auditLogs)
    .values({ recordId: id, changedBy: userId, action: 'DELETE', oldValues: oldRecord, newValues: null })
    .catch((err) => console.error('Audit log failed:', err));

  return { id };
};

export const hardDeleteRecord = async (id) => {
  const [deleted] = await db.delete(financialRecords)
    .where(eq(financialRecords.id, id))
    .returning({ id: financialRecords.id });

  if (!deleted) throw new AppError('Record not found', 404, 'NOT_FOUND');

  return deleted;
};