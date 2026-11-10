// ─── Shared API Response ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Companies ─────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  name: string;
  industry: string;
  phone: string;
  website: string;
  created_at: string;
}

// ─── Customers ─────────────────────────────────────────────────────────────

export type CustomerStatus = "Lead" | "Customer" | "Inactive";

export interface Customer {
  id: number;
  company_id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: CustomerStatus;
  created_at: string;
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export type TaskPriority = "Low" | "Medium" | "High";

export type TaskStatus = "Todo" | "In Progress" | "Done";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  customer_id: number | null;
  created_at: string;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
}
