const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Banking Ledger API",
            version: "1.0.0",
            description:
                "A double-entry ledger banking API. Money transfers are atomic (MongoDB transactions) and idempotent (clients pass an idempotencyKey to safely retry).",
        },
        servers: [
            { url: "https://bankledger-backend-lhhg.onrender.com", description: "Production" },
            { url: "http://localhost:3000", description: "Local development" },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                },
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "65f1c2e0a1b2c3d4e5f60001" },
                        email: { type: "string", example: "alice@example.com" },
                        name: { type: "string", example: "Alice" },
                    },
                },
                Account: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "65f1c2e0a1b2c3d4e5f60010" },
                        user: { type: "string", example: "65f1c2e0a1b2c3d4e5f60001" },
                        status: { type: "string", enum: ["ACTIVE", "FROZEN", "CLOSED"] },
                        currency: { type: "string", example: "INR" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Transaction: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "65f1c2e0a1b2c3d4e5f60100" },
                        fromAccount: { type: "string", example: "65f1c2e0a1b2c3d4e5f60010" },
                        toAccount: { type: "string", example: "65f1c2e0a1b2c3d4e5f60011" },
                        amount: { type: "number", example: 500 },
                        idempotencyKey: { type: "string", example: "txn-2026-04-30-001" },
                        status: {
                            type: "string",
                            enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
                        },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Something went wrong" },
                    },
                },
            },
        },
    },
    apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
