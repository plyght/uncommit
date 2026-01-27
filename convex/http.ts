import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/kofi/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const verificationToken = process.env.KOFI_VERIFICATION_TOKEN;
    if (!verificationToken) {
      console.error("KOFI_VERIFICATION_TOKEN not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const formData = await request.formData();
    const dataString = formData.get("data");

    if (!dataString || typeof dataString !== "string") {
      return new Response("Missing data field", { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(dataString);
    } catch {
      return new Response("Invalid JSON in data field", { status: 400 });
    }

    if (data.verification_token !== verificationToken) {
      console.error("Invalid Ko-fi verification token");
      return new Response("Unauthorized", { status: 401 });
    }

    await ctx.runMutation(internal.kofi.saveSubscription, {
      email: data.email,
      kofiTransactionId: data.message_id,
      type: data.type,
      tierName: data.tier_name || undefined,
      isFirstSubscription: data.is_first_subscription_payment ?? false,
      isSubscriptionPayment: data.is_subscription_payment ?? false,
      amount: data.amount,
      currency: data.currency,
      kofiFromName: data.from_name,
      message: data.message || undefined,
      isPublic: data.is_public ?? true,
      timestamp: Date.now(),
    });

    return new Response(null, { status: 200 });
  }),
});

export default http;
