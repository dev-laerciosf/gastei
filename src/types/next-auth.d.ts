import { DefaultSession } from "next-auth";
import type { Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      householdId: string | null;
      plan: Plan;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    householdId?: string | null;
    plan?: Plan;
  }
}
