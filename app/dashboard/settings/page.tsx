import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileSettingsClient from "@/components/dashboard/ProfileSettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, image: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-[#0c1421] uppercase">
          System Config
        </h1>
        <p className="text-sm text-slate-500">
          View your profile details and customize your identity inside the vault.
        </p>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/80 shadow-xl p-8">
        <ProfileSettingsClient user={user} />
      </div>
    </div>
  );
}

