import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Plan } from "@prisma/client";
import { PLANS } from "@/lib/plans";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function getUserPlan(): Promise<Plan> {
  const session = await auth();
  return session?.user?.plan ?? "FREE";
}

export async function requireFeature(feature: keyof typeof PLANS.FREE.limits): Promise<Plan> {
  const session = await requireAuth();
  const plan = session.user.plan ?? "FREE";
  const limit = PLANS[plan].limits[feature];
  const hasAccess = typeof limit === "boolean" ? limit : limit > 0;
  if (!hasAccess) {
    redirect("/settings/billing?upgrade=true");
  }
  return plan;
}
