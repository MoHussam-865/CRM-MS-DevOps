// src/routes/notify.ts — POST /notify

import { Router, type Request, type Response } from "express";
import { ok, fail } from "../utils/response";
import { createNotification } from "../services/notificationService";
import { NotifyInputSchema } from "../models/notification";
import { ZodError } from "zod";

const router = Router();

router.post("/notify", async (req: Request, res: Response) => {
  try {
    const { title, message } = NotifyInputSchema.parse(req.body);
    const notification = await createNotification(title, message);
    res.status(201).json(ok(notification));
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(fail(err.issues[0]?.message ?? "Validation error", 400));
      return;
    }
    console.error("POST /notify error:", err instanceof Error ? err.message : err);
    res.status(500).json(fail("Internal server error", 500));
  }
});

export default router;