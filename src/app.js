const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

/**
 * - Security & logging middleware
 */
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));

/**
 * - Body & cookie parsers
 */
app.use(express.json());
app.use(cookieParser());

/**
 * - Rate limiter for auth routes (5 attempts per 15 minutes)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many auth attempts, please try again later" }
});

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

/**
 * - Use Routes
 */

app
.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Banking Ledger API, its up and running" })
});

/**
 * - API documentation (Swagger UI)
 * - Interactive docs at /api-docs, raw OpenAPI spec at /api-docs.json
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);


/**
 * - 404 handler (must come after all routes)
 */
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

/**
 * - Global error handler (must come after all routes and middleware)
 */
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || "Something went wrong"
    });
});

module.exports = app;
