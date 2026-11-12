// src/routes/notifications.ts — GET /notifications

import { Router, type Request, type Response } from "express";
import { ok, fail } from "../utils/response";
import { listNotifications } from "../services/notificationService";

const router = Router();

router.get("/notifications", async (_req: Request, res: Response) => {
  try {
    const notifications = await listNotifications();
    res.json(ok(notifications));
  } catch (err) {
    console.error("GET /notifications error:", err instanceof Error ? err.message : err);
    res.status(500).json(fail("Internal server error", 500));
  }
});

export default router;