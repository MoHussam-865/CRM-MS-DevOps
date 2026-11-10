"use client";

import { useAuth } from "@/src/contexts/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Profile</h1>
        <p className="mt-2 text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Profile</h1>

      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-500">Name</dt>
            <dd className="mt-1 text-zinc-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Email</dt>
            <dd className="mt-1 text-zinc-900">{user.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
