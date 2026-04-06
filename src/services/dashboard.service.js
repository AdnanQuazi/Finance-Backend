import { sql, desc, isNull } from 'drizzle-orm';
import { db } from '../config/db.js';
import { financialRecords } from '../db/schema.js';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Coerce a raw DB value to a plain JS number.
 * Drizzle returns NUMERIC columns as strings; SUM can return null on empty sets
 * even with COALESCE when the driver does not cast the result.
 */
const toNumber = (value) => Number(value ?? 0);

/**
 * Build a parameterised date-range fragment.
 * Returns a self-contained sql`` chunk that can be AND-ed into any WHERE clause.
 * All values go through Drizzle's parameterisation — no string interpolation.
 */
const buildDateFilter = (from, to) => {
  if (from && to) return sql`date BETWEEN ${from}::date AND ${to}::date`;
  if (from)       return sql`date >= ${from}::date`;
  if (to)         return sql`date <= ${to}::date`;
  return sql`TRUE`;
};

/**
 * Whitelist the period string to a safe DATE_TRUNC literal.
 * sql.raw() is intentional here — the value never comes from user input
 * directly; it has already been validated by the Zod schema to be exactly
 * 'monthly' or 'weekly'.
 */
const PERIOD_INTERVAL = {
  weekly:  sql.raw(`'week'`),
  monthly: sql.raw(`'month'`),
};

// ─── Service functions ────────────────────────────────────────────────────────

export const getSummary = async () => {
  const { rows } = await db.execute(sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) AS total_income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expenses
    FROM financial_records
    WHERE deleted_at IS NULL
  `);

  const row = rows[0];
  const totalIncome   = toNumber(row?.total_income);
  const totalExpenses = toNumber(row?.total_expenses);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
};

export const getCategories = async () => {
  const { rows } = await db.execute(sql`
    SELECT
      category,
      type,
      COALESCE(SUM(amount), 0) AS total
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `);

  return rows.map((r) => ({
    category: r.category,
    type:     r.type,
    total:    toNumber(r.total),
  }));
};

export const getTrends = async (period = 'monthly', from, to) => {
  const interval   = PERIOD_INTERVAL[period] ?? PERIOD_INTERVAL.monthly;
  const dateFilter = buildDateFilter(from, to);

  const { rows } = await db.execute(sql`
    SELECT
      DATE_TRUNC(${interval}, date) AS period,
      type,
      COALESCE(SUM(amount), 0)      AS total
    FROM financial_records
    WHERE deleted_at IS NULL
      AND ${dateFilter}
    GROUP BY period, type
    ORDER BY period ASC
  `);

  return rows.map((r) => ({
    period: r.period,
    type:   r.type,
    total:  toNumber(r.total),
  }));
};

export const getActivity = async () => {
  const records = await db.select({
    id:          financialRecords.id,
    type:        financialRecords.type,
    amount:      financialRecords.amount,
    category:    financialRecords.category,
    date:        financialRecords.date,
    notes: financialRecords.notes,
    createdAt:   financialRecords.createdAt,
  })
    .from(financialRecords)
    .where(isNull(financialRecords.deletedAt))
    .orderBy(desc(financialRecords.date), desc(financialRecords.createdAt))
    .limit(10);

  return records.map((r) => ({
    ...r,
    amount: toNumber(r.amount),
  }));
};