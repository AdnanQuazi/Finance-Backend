import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { eq, desc } from "drizzle-orm";
import app from "../src/app.js";
import { db } from "../src/config/db.js";
import {
  users,
  financialRecords,
  auditLogs,
  idempotencyKeys,
} from "../src/db/schema.js";

describe("Financial Records Integration Tests", () => {
  const usersSetup = {
    admin: {
      name: "Admin",
      email: "admin_record@finance.com",
      password: "Password123!",
      role: "admin",
    },
    manager: {
      name: "Manager",
      email: "manager_record@finance.com",
      password: "Password123!",
      role: "manager",
    },
    viewer: {
      name: "Viewer",
      email: "viewer_record@finance.com",
      password: "Password123!",
      role: "viewer",
    },
  };

  const tokens = {};
  const userIds = {};

  beforeAll(async () => {
    await db.delete(auditLogs);
    await db.delete(financialRecords);
    await db.delete(idempotencyKeys);

    for (const [key, user] of Object.entries(usersSetup)) {
      await db.delete(users).where(eq(users.email, user.email));
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      const [insertedUser] = await db
        .insert(users)
        .values({ ...user, password: hash })
        .returning();
      userIds[key] = insertedUser.id;

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });
      tokens[key] = loginRes.body.data.token;
    }
  });

  beforeEach(async () => {
    await db.delete(auditLogs);
    await db.delete(financialRecords);
  });

  afterAll(async () => {
    await db.delete(auditLogs);
    await db.delete(idempotencyKeys);
    await db.delete(financialRecords);
    for (const user of Object.values(usersSetup)) {
      await db.delete(users).where(eq(users.email, user.email));
    }
  });

  describe("POST /records (Create & Validation)", () => {
    const payload = {
      amount: 1500.5,
      type: "income",
      category: "freelance",
      date: "2024-05-15",
      notes: "Initial deposit",
    };

    it("Should block Viewer from creating a record", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.viewer}`)
        .set("x-idempotency-key", "key1")
        .send(payload);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("Should require x-idempotency-key header", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Manager should be able to create a record & log audit", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", `create-${Date.now()}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe("1500.50");
      expect(res.body.data.category).toBe("freelance");

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.recordId, res.body.data.id));
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("INSERT");
    });

    it("Should return cached response on duplicate idempotency key", async () => {
      const key = `dup-key-${Date.now()}`;

      const res1 = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", key)
        .send(payload);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const res2 = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", key)
        .send(payload);

      expect(res2.status).toBe(201);
      expect(res2.body.data.id).toBe(res1.body.data.id);

      const dbRecords = await db.select().from(financialRecords);
      expect(dbRecords.length).toBe(1);
    });

    it("Should return 400 when amount is negative", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", `bad-amt-${Date.now()}`)
        .send({ ...payload, amount: -500 });
      expect(res.status).toBe(400);
    });

    it("Should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", `miss-${Date.now()}`)
        .send({ category: "test" });
      expect(res.status).toBe(400);
    });

    it("Should return 400 for invalid type", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", `type-${Date.now()}`)
        .send({ ...payload, type: "invalid" });
      expect(res.status).toBe(400);
    });

    it("Should return 400 for invalid date format (YYYY/MM/DD)", async () => {
      const res = await request(app)
        .post("/records")
        .set("Authorization", `Bearer ${tokens.manager}`)
        .set("x-idempotency-key", `date-${Date.now()}`)
        .send({ ...payload, date: "2024/05/15" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /records (Read, Filter, Pagination)", () => {
    beforeEach(async () => {
      await db.insert(financialRecords).values([
        {
          amount: "200.00",
          type: "expense",
          category: "software",
          date: "2024-05-10",
          createdBy: userIds.admin,
          notes: "Subscription",
        },
        {
          amount: "50.00",
          type: "expense",
          category: "meals",
          date: "2024-05-12",
          createdBy: userIds.manager,
          notes: "Team Lunch",
        },
        {
          amount: "1000.00",
          type: "income",
          category: "freelance",
          date: "2024-05-15",
          createdBy: userIds.admin,
          notes: "Project Initial",
        },
      ]);
    });

    it("Viewer should be able to read records", async () => {
      const res = await request(app)
        .get("/records")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBe(3);
    });

    it("Should filter records by type and category", async () => {
      const res = await request(app)
        .get("/records?type=expense&category=software")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe("software");
    });

    it("Should paginate results properly", async () => {
      const res = await request(app)
        .get("/records?page=1&limit=1")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(3);
    });

    it("Should filter by date range (from/to)", async () => {
      const res = await request(app)
        .get("/records?from=2024-05-11&to=2024-05-14")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe("meals");
    });

    it("Should search by notes/category", async () => {
      const res = await request(app)
        .get("/records?search=Initial")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].notes).toBe("Project Initial");
    });

    it("Should respect sortBy and order", async () => {
      const res = await request(app)
        .get("/records?sortBy=amount&order=asc")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data[0].amount)).toBe(50);
    });

    it("Should return empty array when no records match filters", async () => {
      const res = await request(app)
        .get("/records?type=expense&category=nonexistent")
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("GET & PATCH /records/:id", () => {
    let recordId;

    beforeEach(async () => {
      const [r] = await db
        .insert(financialRecords)
        .values({
          amount: "100",
          type: "income",
          category: "test",
          date: "2024-05-15",
          createdBy: userIds.admin,
        })
        .returning();
      recordId = r.id;
    });

    it("Viewer can fetch a single record by ID", async () => {
      const res = await request(app)
        .get(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(recordId);
    });

    it("Returns 404 for non-existent ID", async () => {
      const res = await request(app)
        .get(`/records/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(404);
    });

    it("Viewer should be blocked from updating", async () => {
      const res = await request(app)
        .patch(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.viewer}`)
        .send({ notes: "Blocked" });
      expect(res.status).toBe(403);
    });

    it("Manager should be able to update & log audit", async () => {
      const res = await request(app)
        .patch(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.manager}`)
        .send({ notes: "Updated by manager" });
      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe("Updated by manager");

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.recordId, recordId))
        .orderBy(desc(auditLogs.createdAt));
      expect(logs[0].action).toBe("UPDATE");
      expect(logs[0].newValues.notes).toBe("Updated by manager");
    });

    it("Admin should also be able to update", async () => {
      const res = await request(app)
        .patch(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.admin}`)
        .send({ notes: "Admin Update" });
      expect(res.status).toBe(200);
    });

    it("Returns 404 when updating non-existent record", async () => {
      const res = await request(app)
        .patch(`/records/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${tokens.manager}`)
        .send({ notes: "Test" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /records/:id (Soft & Hard Delete)", () => {
    let recordId;

    beforeEach(async () => {
      const [r] = await db
        .insert(financialRecords)
        .values({
          amount: "100",
          type: "income",
          category: "delete_test",
          date: "2024-05-15",
          createdBy: userIds.admin,
        })
        .returning();
      recordId = r.id;
    });

    it("Viewer should be blocked from soft deleting", async () => {
      const res = await request(app)
        .delete(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(res.status).toBe(403);
    });

    it("Manager should be able to soft delete & hide from GET", async () => {
      const res = await request(app)
        .delete(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.manager}`);
      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.viewer}`);
      expect(getRes.status).toBe(404);

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.recordId, recordId))
        .orderBy(desc(auditLogs.createdAt));
      expect(logs[0].action).toBe("DELETE");
    });

    it("Admin should be able to soft delete too", async () => {
      const res = await request(app)
        .delete(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
    });

    it("Returns 404 when soft-deleting non-existent record", async () => {
      const res = await request(app)
        .delete(`/records/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${tokens.manager}`);
      expect(res.status).toBe(404);
    });

    it("Returns 404 when patching a soft-deleted record", async () => {
      await request(app)
        .delete(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.manager}`);
      const res = await request(app)
        .patch(`/records/${recordId}`)
        .set("Authorization", `Bearer ${tokens.manager}`)
        .send({ notes: "Test" });
      expect(res.status).toBe(404);
    });

    it("Manager should be blocked from hard deleting", async () => {
      const res = await request(app)
        .delete(`/records/${recordId}/hard`)
        .set("Authorization", `Bearer ${tokens.manager}`);
      expect(res.status).toBe(403);
    });

    it("Admin should be able to hard delete a record", async () => {
      const res = await request(app)
        .delete(`/records/${recordId}/hard`)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);

      const inDb = await db
        .select()
        .from(financialRecords)
        .where(eq(financialRecords.id, recordId));
      expect(inDb.length).toBe(0);
    });
  });
});
