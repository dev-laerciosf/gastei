import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getStripeWebhookSecret } from "@/lib/env";
import { syncSubscriptionFromStripe } from "@/lib/actions/billing";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        await syncSubscriptionFromStripe(subId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(subscription.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
      if (subRef) {
        const subId = typeof subRef === "string" ? subRef : subRef.id;
        await syncSubscriptionFromStripe(subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
