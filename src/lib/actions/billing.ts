"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth-guard";
import { PLANS, getPlanFromPriceId } from "@/lib/plans";
import { getAppUrl } from "@/lib/env";
import type { Plan } from "@prisma/client";

export async function getSubscription() {
  const session = await requireAuth();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  return subscription;
}

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(plan: "PRO" | "PREMIUM") {
  const session = await requireAuth();
  const appUrl = getAppUrl();
  const priceId = PLANS[plan].stripePriceId;

  if (!priceId) {
    return { error: "Plano inválido" };
  }

  const customerId = await getOrCreateStripeCustomer(session.user.id);

  const checkoutSession = await stripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    metadata: { userId: session.user.id, plan },
  });

  return { url: checkoutSession.url };
}

export async function createPortalSession() {
  const session = await requireAuth();
  const appUrl = getAppUrl();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    return { error: "Nenhuma assinatura encontrada" };
  }

  const portalSession = await stripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/settings/billing`,
  });

  return { url: portalSession.url };
}

export async function syncSubscriptionFromStripe(stripeSubscriptionId: string) {
  const sub = await stripe().subscriptions.retrieve(stripeSubscriptionId);

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id ?? "";
  const plan: Plan = getPlanFromPriceId(priceId);

  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;

  const statusMap: Record<string, "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    trialing: "ACTIVE",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };

  const data = {
    plan,
    status: statusMap[sub.status] ?? "INCOMPLETE",
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
}
