// lib/services/taskService.ts — task business logic

import * as repo from "../repositories/taskRepository";
import { sendNotification } from "./notificationClient";
import type { Task } from "../models/task";

export async function listTasks(): Promise<Task[]> {
  return repo.findAll();
}

export async function createTask(data: {
  customer_id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
}): Promise<Task> {
  const task = await repo.create(data);
  // fire-and-forget
  sendNotification("Task Assigned", `Task "${task.title}" was assigned.`);
  return task;
}

export async function updateTask(
  id: string,
  data: {
    customer_id?: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    due_date?: string;
  }
): Promise<Task> {
  // Fetch current task to detect status transition
  const current = await repo.findById(id);
  if (!current) throw new Error("Task not found");

  const task = await repo.update(id, data);
  if (!task) throw new Error("Task not found");

  // Notify if status transitions to "Done"
  if (current.status !== "Done" && task.status === "Done") {
    sendNotification("Task Completed", `Task "${task.title}" is completed.`);
  }

  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error("Task not found");
}