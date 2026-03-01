import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { requireAuth } from "@/lib/auth-guard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <SessionProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
