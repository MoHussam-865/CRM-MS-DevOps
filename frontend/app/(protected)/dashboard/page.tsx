"use client";

import { useState, useEffect } from "react";
import { getApiClient } from "@/src/lib/api";
import type { Notification, Company, Customer, Task } from "@/src/types";

interface DashboardStats {
  totalCustomers: number;
  totalCompanies: number;
  openTasks: number;
  completedTasks: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0, totalCompanies: 0, openTasks: 0, completedTasks: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getApiClient().get<Company[]>("/api/companies"),
      getApiClient().get<Customer[]>("/api/customers"),
      getApiClient().get<Task[]>("/api/tasks"),
      getApiClient().get<Notification[]>("/api/notifications"),
    ])
      .then(([compRes, custRes, taskRes, notifRes]) => {
        if (cancelled) return;
        const allTasks = taskRes.data ?? [];
        setStats({
          totalCompanies: compRes.data?.length ?? 0,
          totalCustomers: custRes.data?.length ?? 0,
          openTasks: allTasks.filter((t) => t.status !== "Done").length,
          completedTasks: allTasks.filter((t) => t.status === "Done").length,
        });
        setNotifications((notifRes.data ?? []).slice(0, 5));
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-4 text-red-500">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: "Customers", value: stats.totalCustomers, color: "bg-blue-500" },
    { label: "Companies", value: stats.totalCompanies, color: "bg-violet-500" },
    { label: "Open Tasks", value: stats.openTasks, color: "bg-amber-500" },
    { label: "Completed Tasks", value: stats.completedTasks, color: "bg-green-500" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className={`mb-3 h-2 w-12 rounded-full ${card.color}`} />
            <p className="text-3xl font-bold text-zinc-900">{card.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{card.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Latest Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-zinc-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="font-medium text-zinc-900">{n.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{n.message}</p>
              <p className="mt-2 text-xs text-zinc-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
