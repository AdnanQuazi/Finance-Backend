# Finance Data Processing and Access Control Backend

A REST API backend for a shared finance dashboard system. All users operate within a single shared dataset (single-company model). Access to data and operations is governed entirely by the user's role. The system features advanced data integrity, including idempotency, rate limiting, token-based authentication, and full audit logging. No frontend is required — APIs are documented via interactive Swagger UI.

## 🚀 Tech Stack

- **Runtime**: Node.js (plain JavaScript for a clean, overhead-free ecosystem)
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon Serverless Free Tier)
- **ORM**: Drizzle ORM + `pg` driver (type-safe query builder, schema-as-code)
- **Validation**: Zod (runtime validation mapped seamlessly to Express routes)
- **Authentication**: JWT (`jsonwebtoken`) + bcrypt (token-based auth)
- **Rate Limiting**: `express-rate-limit` (lightweight IP-based tracking)
- **API Docs**: Swagger UI (`swagger-ui-express` + `swagger-jsdoc`)
- **Testing**: Vitest (`app.integration.test.js`, etc.)

## ✨ Key Features & Architecture

### 1. Token-Based Authentication (JWT)
All endpoints (except login) are secured using JSON Web Tokens via the `Authorization: Bearer <token>` header. The token embeds the user payload to authorize subsequent requests contextually without redundant database hits.

### 2. Role-Based Access Control (RBAC)
The application utilizes a strict four-role hierarchy (`viewer`, `analyst`, `manager`, `admin`) mapped systematically to their specific operational boundaries. For instance, a person entering records (`manager`) is not the same person permitted to manage users (`admin`).

### 3. Pagination & Data Filtering
Endpoints like `GET /records` support full date-range filtering, categorical searching, sorting, and cursor/page limits (`?page=1&limit=10`). Pagination guarantees scalable performance for data-heavy dashboard views.

### 4. Soft Delete Functionality
Financial records utilize an audit-driven schema pattern. `DELETE /records/:id` executes a **Soft Delete** by populating the `deletedAt` timestamp. Hard deletion is restricted purely to `admin` roles, ensuring accidental deletions by operational managers can be traced or reversed without data loss.

### 5. Idempotent Writes
To natively handle network timeouts or double-submit accidents by clients, `POST /records` utilizes an `x-idempotency-key` header. The idempotency middleware prevents duplicate transaction inserts by returning a cached response signature upon retry.

### 6. Rate Limiting
Global two-tier rate limiting defends against brute-force/DOS loops:
- Auth routes (`/auth/*`): 10 requests / 15 minutes.
- API endpoints: 100 requests / 15 minutes.

### 7. Modular API Documentation
Swagger is entirely decoupled into a `src/docs/` structure mapped by domain (`schemas` and `paths`), making the API's contract strictly typed, highly legible during development, and automatically documented at `/api-docs`.

## 🛠️ Assumptions & Tradeoffs

1. **Single-Company Model:** Data architecture is explicitly not multi-tenant. All users hit the same underlying records datasets, governed globally by RBAC. 
2. **Live Aggregation vs. Caching:** Dashboard queries calculate totals live via indexed SQL `COALESCE(SUM(...))` functions on every request, ensuring total precision over performance. For massive scale, this would be updated to Redis caching or PostgreSQL Materialized Views.
3. **Audit Atomicity:** Drizzle's `db.transaction()` ensures `audit_logs` inserts are heavily bound to the same SQL transaction block as the `financial_records` modification. If the log write fails, the entire transaction reverts.
4. **Constraints over App Validation:** Zod enforces validation boundaries in Express, but raw SQL migrations embed exact `CHECK` constraints on amounts and ENUM values (e.g. `amount > 0`).

## ⚙️ Getting Started & Setup

### 1. Prerequisites
- Node.js (v18+ recommended)
- A PostgreSQL connection string (Neon Postgres recommended)

### 2. Environment Configuration
Create a `.env` file in the root based on `.env.example`:
```env
PORT=3000
DATABASE_URL=postgres://user:password@host/dbname
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Installation
Install project dependencies:
```bash
npm install
```

### 4. Database Setup & Migrations
Synchronize internal definitions into PostgreSQL syntax and execute:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 5. Seed the Database
Seed the base 4 roles (`admin`, `manager`, `analyst`, `viewer` arrays) for instant testing parity:
```bash
node scripts/seed.js
```

### 6. Start the Server
Spin up the local environment:
```bash
npm run dev
# OR
npm start
```

## 📚 API Endpoints Overview

Ensure your server is live and navigate to the integrated portal to experiment with endpoints instantly via Swagger UI:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

*For programmatic tests, you must retrieve a Bearer JWT Token generated from `POST /auth/login` (using credentials seeded by `node scripts/seed.js`), and include it as an Authorization token against downstream requests.*

## 🧪 Testing (Integration tests)

The project leverages `vitest` mapped against route-integrated assertions to guarantee HTTP and middleware chains operate as anticipated across the entire database architecture.

To run the integration suite locally:
```bash
npm test
```
