# Banking Ledger API

A production-style backend for a banking application, modeled on how real payment systems are built — **double-entry bookkeeping**, **idempotent money transfers**, and **ACID-compliant transactions** at the database level.

Built to explore the design problems most CRUD tutorials skip: how do you derive a balance you can trust? How do you safely retry a transfer over a flaky network? How do you make sure money is never created or destroyed?

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-blue)](https://jwt.io)
[![OpenAPI](https://img.shields.io/badge/Docs-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](https://swagger.io)

---

## Highlights

- **Double-entry ledger** — every transfer writes paired `DEBIT` and `CREDIT` rows; balances are derived from the ledger via a MongoDB aggregation, never stored. Drift is impossible by design.
- **Idempotent transfers** — every transfer requires a client-supplied `idempotencyKey`. Duplicate submissions return the original result instead of double-spending.
- **ACID transactions** — DEBIT, CREDIT, and status updates all run inside a single MongoDB session. On any failure, the entire transfer rolls back and the transaction is marked `FAILED`.
- **Immutable ledger** — Mongoose middleware blocks `update*` and `delete*` operations on ledger entries; once written, they cannot be changed.
- **JWT auth with token blacklist** — logout invalidates the JWT server-side via a TTL-indexed blacklist collection (auto-purged after 48h).
- **Hardened HTTP layer** — Helmet headers, CORS, rate limiting on auth endpoints, central error handler.
- **Interactive API docs** — OpenAPI 3.0 spec served at `/api-docs` with "Try it out" support.

---

## Live Demo

> **TODO:** populate after Render deploy.

| | |
|---|---|
| API base | `https://<your-app>.onrender.com` |
| Interactive docs | `https://<your-app>.onrender.com/api-docs` |
| Raw OpenAPI spec | `https://<your-app>.onrender.com/api-docs.json` |

Free-tier hosts cold-start; first request after idle may take ~30s.

---

## Architecture

```
                     ┌──────────────┐
                     │  HTTP client │
                     └──────┬───────┘
                            │ (cookie or Bearer JWT)
                ┌───────────▼───────────┐
                │  Express middleware   │   helmet, cors, morgan,
                │                       │   rate limit, JSON parser
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │     Auth middleware   │   verify JWT,
                │                       │   check blacklist
                └───────────┬───────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
   ┌────▼─────┐       ┌─────▼──────┐      ┌──────▼───────┐
   │   Auth   │       │  Accounts  │      │ Transactions │
   │ register │       │  create    │      │  transfer    │
   │  login   │       │  list      │      │  initial     │
   │  logout  │       │  balance   │      │  funds       │
   └────┬─────┘       └─────┬──────┘      └──────┬───────┘
        │                   │                    │
        │              ┌────▼────────────────────▼────┐
        │              │       MongoDB (ACID)         │
        └──────────────►   users • accounts • txns    │
                       │   ledger (immutable, indexed)│
                       └──────────────────────────────┘
```

A single transfer touches **3 collections atomically**: `transactions` (status), `ledger` (DEBIT row), `ledger` (CREDIT row). All three commit together or none do.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 | LTS, modern async support |
| Framework | Express 5 | Minimal, well-understood |
| Database | MongoDB + Mongoose | Multi-document ACID transactions for transfers |
| Auth | JWT (`jsonwebtoken`) + bcrypt | Stateless tokens, salted password hashing |
| Security | Helmet, CORS, express-rate-limit | Standard hardening for public endpoints |
| Email | Nodemailer (Gmail OAuth2) | Registration, login, transaction notifications |
| Docs | swagger-ui-express + swagger-jsdoc | OpenAPI 3.0 generated from route annotations |

---

## Quick Start

```bash
git clone https://github.com/ayushm3018/Banking-Ledger-Backend.git
cd Banking-Ledger-Backend
npm install
cp .env.example .env       # then fill in MONGO_URI, JWT_SECRET, etc.
npm run dev
```

Server starts on `http://localhost:3000`. Open [`/api-docs`](http://localhost:3000/api-docs) for the interactive API explorer.

**Requires** Node.js 20+ and a MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas)). Transfers depend on MongoDB transactions, which require a **replica set** — Atlas free tier has this enabled by default; for local Mongo, start with `mongod --replSet rs0` and initiate the set once.

---

## Design Highlights

### 1. Balance derived from the ledger, not stored

Balances are **never** stored on the `Account` document. Instead, every read aggregates the ledger:

```js
// src/models/account.model.js
accountSchema.methods.getBalance = async function () {
  const [result] = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    { $group: {
        _id: null,
        totalDebit:  { $sum: { $cond: [{ $eq: ["$type", "DEBIT"]  }, "$amount", 0] } },
        totalCredit: { $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] } },
    }},
    { $project: { _id: 0, balance: { $subtract: ["$totalCredit", "$totalDebit"] } } },
  ]);
  return result?.balance ?? 0;
};
```

**Why this matters:** stored balances drift. A failed update, a missed event, a stale cache — and your number no longer matches reality. Deriving from the ledger means the ledger *is* the source of truth, end of story. Real banks operate this way.

### 2. Idempotent transfers via client-supplied keys

Every `POST /api/transactions` requires an `idempotencyKey`. The controller checks for an existing transaction with that key before doing any work, and dispatches based on its status:

| Status of existing txn | Behavior on retry |
|---|---|
| `COMPLETED` | Return original result with HTTP 200 |
| `PENDING` | Return "already in progress" with HTTP 200 |
| `FAILED` | Return failure; client may retry with a new key |
| `REVERSED` | Return reversal info; client may retry with a new key |

The `idempotencyKey` field on the `Transaction` model is a **unique index**, so two concurrent requests with the same key cannot both succeed — the second insert errors out at the DB level. This is the standard pattern used by Stripe, Square, and other payment processors.

### 3. Atomicity via MongoDB transactions

A transfer is four writes that must succeed or fail together:

```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. create transaction (PENDING)
  // 2. write DEBIT ledger row for sender
  // 3. write CREDIT ledger row for receiver
  // 4. mark transaction COMPLETED
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  // mark transaction FAILED outside the aborted session
}
```

If step 3 throws (e.g., DB hiccup mid-write), `abortTransaction` rolls back steps 1–2 in the same atomic unit. The DEBIT never lands without its CREDIT — money is never created or destroyed.

### 4. Immutable ledger entries

The ledger is **append-only**. Mongoose middleware throws on every modify operation:

```js
ledgerSchema.pre("findOneAndUpdate", () => { throw new Error("Ledger entries cannot be modified"); });
ledgerSchema.pre("updateOne",        () => { throw new Error("Ledger entries cannot be modified"); });
ledgerSchema.pre("deleteOne",        () => { throw new Error("Ledger entries cannot be modified"); });
// ...etc for updateMany, deleteMany, update
```

Reversals, corrections, and adjustments are modeled as **new compensating entries**, not edits. This is what auditability looks like at the data layer.

### 5. Stateless auth + server-side logout

JWTs are stateless — which makes logout hard, because the token stays valid until expiry no matter what the client does. This API solves it with a `blacklistToken` collection:

- On `POST /api/auth/logout`, the current JWT is inserted into `blacklistToken`.
- The auth middleware checks the blacklist on every request and rejects blacklisted tokens.
- The blacklist collection has a **TTL index** (`expireAfterSeconds: 48h`) so MongoDB auto-purges expired entries — the table never grows unbounded.

---

## API Reference

Full interactive docs at **`/api-docs`**. Quick summary:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create user, issue JWT |
| `POST` | `/api/auth/login` | — | Authenticate, issue JWT |
| `POST` | `/api/auth/logout` | JWT | Blacklist current JWT |
| `POST` | `/api/accounts` | JWT | Create an account |
| `GET`  | `/api/accounts` | JWT | List the user's accounts |
| `GET`  | `/api/accounts/balance/:accountId` | JWT | Get derived balance |
| `POST` | `/api/transactions` | JWT | Transfer money (idempotent) |
| `POST` | `/api/transactions/system/initial-funds` | system JWT | Seed an account from system reserves |

Auth accepts the JWT either as the `token` cookie (set on register/login) **or** as `Authorization: Bearer <token>`.

---

## Project Structure

```
src/
├── app.js                    # Express app: middleware, routes, error handlers
├── config/
│   ├── db.js                 # Mongoose connection
│   └── swagger.js            # OpenAPI spec config (swagger-jsdoc)
├── routes/
│   ├── auth.routes.js        # /api/auth/*       + OpenAPI annotations
│   ├── account.routes.js     # /api/accounts/*   + OpenAPI annotations
│   └── transaction.routes.js # /api/transactions/* + OpenAPI annotations
├── controllers/              # Route handlers (business logic)
├── middleware/
│   └── auth.middlware.js     # JWT verify + blacklist check
├── models/
│   ├── user.model.js         # bcrypt pre-save hook
│   ├── account.model.js      # derived balance via aggregation
│   ├── transaction.model.js  # unique idempotencyKey index
│   ├── ledger.model.js       # immutable, indexed
│   └── blacklistToken.model.js # TTL-indexed
└── services/
    └── email.service.js      # Nodemailer + Gmail OAuth2
server.js                     # Entry point: connect DB → start server
```

---

## Roadmap

Tracked in [IMPROVEMENTS.md](IMPROVEMENTS.md). Highest-priority items:

- [ ] **Tests** — Jest + Supertest, focusing on the transfer flow (idempotent retry, insufficient balance, transaction rollback)
- [ ] **Input validation layer** — Zod or Joi at the route boundary; current validation is ad-hoc inside controllers
- [ ] **`httpOnly`, `secure`, `sameSite` cookie flags** for the JWT cookie
- [ ] **Refresh token system** — short-lived access tokens, long-lived refresh tokens
- [ ] **Background email queue** (BullMQ + Redis) — currently email send blocks the request
- [ ] **Dockerization** — `Dockerfile` + `docker-compose.yml` for one-command local setup
- [ ] **Transaction reversal endpoint** — write compensating ledger entries, mark original as `REVERSED`
- [ ] **CI** — GitHub Actions running lint + tests on every PR

---

## License

MIT

## Author

**Ayush Mishra** — [github.com/ayushm3018](https://github.com/ayushm3018)
