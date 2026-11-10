import { AuthGuard } from "@/src/components/AuthGuard";
import Sidebar from "@/src/components/Sidebar";
import type { ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
