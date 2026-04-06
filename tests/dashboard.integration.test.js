import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import app from "../src/app.js";
import { db } from "../src/config/db.js";
import { users, financialRecords, auditLogs } from "../src/db/schema.js";

const makeRecord = (overrides = {}) => ({
  amount: "500.00",
  type: "income",
  category: "freelance",
  date: "2024-05-15",
  ...overrides,
});

describe("Dashboard Integration Tests (Complete & Pollution-Free)", () => {
  const usersSetup = {
    admin: { name: "Admin", email: "admin_dash@finance.com", password: "Password123!", role: "admin" },
    analyst: { name: "Analyst", email: "analyst_dash@finance.com", password: "Password123!", role: "analyst" },
    viewer: { name: "Viewer", email: "viewer_dash@finance.com", password: "Password123!", role: "viewer" },
  };

  const tokens = {};
  const userIds = {};

  beforeAll(async () => {
    await db.delete(auditLogs);
    await db.delete(financialRecords);
    
    for (const [key, user] of Object.entries(usersSetup)) {
      await db.delete(users).where(eq(users.email, user.email));
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      const [insertedUser] = await db.insert(users).values({ ...user, password: hash }).returning();
      userIds[key] = insertedUser.id;

      const loginRes = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
      tokens[key] = loginRes.body.data.token;
    }
  });

  beforeEach(async () => {
    await db.delete(auditLogs);
    await db.delete(financialRecords);
  });

  afterAll(async () => {
    await db.delete(auditLogs);
    await db.delete(financialRecords);
    for (const user of Object.values(usersSetup)) {
      await db.delete(users).where(eq(users.email, user.email));
    }
  });

  // ── SUMMARY (Aggregation & Soft Delete) ──
  describe("GET /dashboard/summary", () => {
    it("Calculates net balance correctly and strictly ignores soft-deleted records", async () => {
      const [deleted] = await db.insert(financialRecords).values(makeRecord({ amount: "999.00", createdBy: userIds.admin })).returning();
      await request(app).delete(`/records/${deleted.id}`).set("Authorization", `Bearer ${tokens.admin}`);

      await db.insert(financialRecords).values([
        makeRecord({ amount: "1000.00", type: "income", createdBy: userIds.admin }),
        makeRecord({ amount: "300.00", type: "expense", createdBy: userIds.admin }),
      ]);

      const res = await request(app).get("/dashboard/summary").set("Authorization", `Bearer ${tokens.viewer}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(1000);
      expect(res.body.data.totalExpenses).toBe(300);
      expect(res.body.data.netBalance).toBe(700);
    });

    it("Returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/dashboard/summary");
      expect(res.status).toBe(401);
    });
  });

  // ── ACTIVITY (Pagination & Ordering) ──
  describe("GET /dashboard/activity", () => {
    it("Returns max 10 records ordered by date descending", async () => {
      const batch = Array.from({ length: 12 }, (_, i) =>
        makeRecord({ date: `2024-05-${String((i % 28) + 1).padStart(2, "0")}`, createdBy: userIds.admin })
      );
      await db.insert(financialRecords).values(batch);

      const res = await request(app).get("/dashboard/activity").set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(10);
      // Verify DESC sort
      expect(new Date(res.body.data[0].date).getTime()).toBeGreaterThanOrEqual(new Date(res.body.data[1].date).getTime());
    });
  });

  // ── CATEGORIES (RBAC & Grouping) ──
  describe("GET /dashboard/categories", () => {
    it("Blocks Viewer role from accessing categories (403)", async () => {
      const res = await request(app).get("/dashboard/categories").set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(403);
    });

    it("Groups and sums by category successfully for Analysts", async () => {
      await db.insert(financialRecords).values([
        makeRecord({ amount: "200.00", category: "freelance", createdBy: userIds.admin }),
        makeRecord({ amount: "300.00", category: "freelance", createdBy: userIds.admin }),
        makeRecord({ amount: "150.00", type: "expense", category: "software", createdBy: userIds.admin }),
      ]);

      const res = await request(app).get("/dashboard/categories").set("Authorization", `Bearer ${tokens.analyst}`);

      expect(res.status).toBe(200);
      const freelance = res.body.data.find(r => r.category === "freelance");
      expect(freelance.total).toBe(500);
    });
  });

  // ── TRENDS (Filtering & Idempotency) ──
  describe("GET /dashboard/trends", () => {
    it("Filters by date range correctly", async () => {
      await db.insert(financialRecords).values([
        makeRecord({ amount: "400.00", date: "2024-01-15", createdBy: userIds.admin }),
        makeRecord({ amount: "600.00", date: "2024-06-10", createdBy: userIds.admin }),
      ]);

      const res = await request(app).get("/dashboard/trends?from=2024-06-01").set("Authorization", `Bearer ${tokens.analyst}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].total).toBe(600);
    });

    it("Ensures Idempotency: Multiple identical requests return exactly the same data", async () => {
      await db.insert(financialRecords).values([
        makeRecord({ amount: "400.00", createdBy: userIds.admin }),
        makeRecord({ amount: "200.00", type: "expense", category: "software", createdBy: userIds.admin }),
      ]);

      const res1 = await request(app).get("/dashboard/trends?period=monthly").set("Authorization", `Bearer ${tokens.analyst}`);
      const res2 = await request(app).get("/dashboard/trends?period=monthly").set("Authorization", `Bearer ${tokens.analyst}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      // Deep equality check guarantees stable caching/read logic
      expect(res1.body.data).toEqual(res2.body.data); 
    });
  });

  // ── CROSS-ENDPOINT CONSISTENCY ──
  describe("Cross-Endpoint Consistency", () => {
    it("Summary totals perfectly match the aggregated Category totals", async () => {
      await db.insert(financialRecords).values([
        makeRecord({ amount: "300.00", type: "income", category: "freelance", createdBy: userIds.admin }),
        makeRecord({ amount: "200.00", type: "income", category: "salary", createdBy: userIds.admin }),
        makeRecord({ amount: "100.00", type: "expense", category: "software", createdBy: userIds.admin }),
      ]);

      const [summaryRes, categoriesRes] = await Promise.all([
        request(app).get("/dashboard/summary").set("Authorization", `Bearer ${tokens.analyst}`),
        request(app).get("/dashboard/categories").set("Authorization", `Bearer ${tokens.analyst}`),
      ]);

      const summedIncome = categoriesRes.body.data
        .filter((r) => r.type === "income")
        .reduce((acc, r) => acc + r.total, 0);

      const summedExpenses = categoriesRes.body.data
        .filter((r) => r.type === "expense")
        .reduce((acc, r) => acc + r.total, 0);

      expect(summedIncome).toBe(summaryRes.body.data.totalIncome);
      expect(summedExpenses).toBe(summaryRes.body.data.totalExpenses);
    });
  });
});