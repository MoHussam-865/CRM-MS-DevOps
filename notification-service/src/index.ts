// src/index.ts — Express app entry point

import "dotenv/config";
import express from "express";
import { getConfig } from "./config";
import { closePool } from "./db";
import { migrate } from "./migrate";
import notifyRouter from "./routes/notify";
import notificationsRouter from "./routes/notifications";

const app = express();
const config = getConfig();

// Middleware
app.use(express.json());

// Routes
app.post("/notify", notifyRouter);
app.get("/notifications", notificationsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Graceful shutdown handler (declared before server so hoisting isn't an issue)
let shutdownHandler: (() => void) | null = null;

// Run migrations, then start server
(async () => {
  try {
    await migrate();
    const server = app.listen(config.PORT, () => {
      console.log(`📬 Notification service listening on port ${config.PORT}`);
    });

    shutdownHandler = async () => {
      console.log("\nShutting down...");
      server.close();
      await closePool();
      process.exit(0);
    };
  } catch (err) {
    console.error("❌ Migration failed, exiting:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();

process.on("SIGINT", () => shutdownHandler?.());
process.on("SIGTERM", () => shutdownHandler?.());