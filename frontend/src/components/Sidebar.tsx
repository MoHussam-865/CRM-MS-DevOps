"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/companies", label: "Companies", icon: "🏢" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <span className="text-lg font-bold text-zinc-900">MicroCRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-zinc-200 px-4 py-4">
        <p className="mb-2 truncate text-sm text-zinc-500">
          {user?.name ?? user?.email}
        </p>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
