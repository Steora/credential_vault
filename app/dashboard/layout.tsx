import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import InactiveAccountShell from "@/components/dashboard/InactiveAccountShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // The middleware handles the redirect for unauthenticated users,
  // but we guard here too so the layout never renders without a session.
  if (!session?.user) redirect("/login");

  if (session.user.isActive === false) {
    return <InactiveAccountShell />;
  }

  const user = {
    id:    session.user.id,
    name:  session.user.name,
    email: session.user.email,
    role:  session.user.role,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <main className="flex min-h-svh flex-col gap-4 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
