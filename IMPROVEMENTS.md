# Improvements & Future Scope

A running list of production-level improvements identified during code review.

---

## `server.js`
- [ ] Use `process.env.PORT` instead of hardcoded `3000`
- [ ] Await `connectToDB()` before starting the server (server should not accept requests until DB is ready)
- [ ] Add graceful shutdown (close DB connection on SIGINT/SIGTERM)
- [ ] Add error handling around `app.listen` (e.g., port already in use)

## `package.json`
- [ ] Remove unused packages: `cookieparser`, `js`
- [ ] Update `"main"` from `"index.js"` to `"server.js"`
- [ ] Move `nodemon` to `devDependencies`
- [ ] Add `"engines"` field to specify Node version

## `src/config/db.js`
- [ ] Make `connectToDB` return the promise so `server.js` can `await` it
- [ ] Add Mongoose connection event listeners (`disconnected`, `reconnected`, `error`)
- [ ] Validate `MONGO_URI` exists at startup
- [ ] Fix typo: `Erorr` → `Error`

## `src/app.js`
- [x] Already added: helmet, cors, morgan, rate limiting, 404 handler, error handler ✅
- [ ] Restrict CORS origin to specific frontend domain (currently `origin: true`)



## `src/services/email.service.js`
- [ ] Switch from Gmail to a transactional email service (SendGrid, Mailgun, AWS SES) for production
- [ ] Move email HTML templates to separate files
- [ ] Send emails via a background queue (BullMQ) instead of blocking the request
- [ ] Move sender name `"Backend Ledger"` to `.env`

## `src/middleware/auth.middlware.js`

- [ ] Cache user lookups in Redis to avoid DB query on every request


## `src/controllers/auth.controller.js`
- [ ] Add try/catch around DB calls for clean error responses
- [ ] Set cookies with `httpOnly: true, secure: true, sameSite: "strict"`
- [ ] Move email sending to a background queue
- [ ] Set cookie in login (currently only set in register)
- [ ] Add refresh token system
- [ ] DRY refactor: extract JWT signing + cookie + response into a utility (`utils/auth.utils.js`) and - [ ] Add a `utils/` folder for pure helpers


## General / Architecture
- [ ] Add input validation layer (Zod/Joi)
- [ ] Add unit + integration tests (Jest, Supertest)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add a `.env.example` file (template for required env vars)
- [ ] Add ESLint + Prettier for code style consistency
