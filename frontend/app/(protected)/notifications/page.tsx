"use client";

import { useState, useEffect } from "react";
import { getApiClient } from "@/src/lib/api";
import type { Notification } from "@/src/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getApiClient()
      .get<Notification[]>("/api/notifications")
      .then((res) => {
        if (res.data) setNotifications(res.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
        <p className="mt-4 text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-zinc-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h3 className="font-medium text-zinc-900">{n.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{n.message}</p>
              <p className="mt-2 text-xs text-zinc-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
