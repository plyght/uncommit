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

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + thirtyDaysMs;
    const tier = data.tier_name || (data.type === "Subscription" ? "supporter" : "supporter");

    await ctx.runMutation(internal.kofi.updateUserSubscription, {
      email: data.email,
      status: "active",
      tier,
      expiresAt,
    });

    await ctx.runMutation(internal.kofi.updateRepoLimitsForUser, {
      email: data.email,
      tierName: data.tier_name,
    });

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/ai/generate-release",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiSecret = process.env.AI_WEBHOOK_SECRET;
    if (!apiSecret) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { repoOwner, repoName, version, diff, provider } = body;

    if (!repoOwner || !repoName || !version || !diff || !provider) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const repo = await ctx.runQuery(internal.repos.getRepoByName, {
      repoOwner,
      repoName,
    });

    if (!repo || repo.apiKeyMode !== "managed") {
      return new Response(JSON.stringify({ error: "Repo not found or not using managed API keys" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usage = await ctx.runQuery(internal.pricing.getUsageForCurrentMonth, {
      userId: repo.userId,
      repoOwner,
      repoName,
    });

    if (!usage.canGenerate) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded",
        usage: usage.count,
        limit: usage.limit,
      }), { 
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = "Generate release notes from code diffs. Rules:\n- No emojis\n- No title (GitHub shows it)\n- Minimal, concise, comprehensive\n- Only sections with changes (omit empty ones)\n- Markdown ## headers: Features, Fixes, Improvements, Breaking Changes\n- User-facing changes only\n- Version-only bump = \"Maintenance release.\"";

    let notes = "Maintenance release.";
    let tokensUsed = 0;

    try {
      if (provider === "anthropic") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ 
              role: "user", 
              content: `Generate release notes for v${version}.\n\nCode diff:\n${diff}` 
            }],
          }),
        });

        const result = await response.json();
        notes = result.content?.[0]?.text || "Maintenance release.";
        tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);
      } else if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5.2",
            messages: [
              { role: "system", content: systemPrompt },
              { 
                role: "user", 
                content: `Generate release notes for v${version}.\n\nCode diff:\n${diff}` 
              },
            ],
            max_completion_tokens: 2000,
          }),
        });

        const result = await response.json();
        notes = result.choices?.[0]?.message?.content || "Maintenance release.";
        tokensUsed = (result.usage?.prompt_tokens || 0) + (result.usage?.completion_tokens || 0);
      }
    } catch (error) {
      console.error("AI generation error:", error);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(internal.pricing.recordUsageInternal, {
      userId: repo.userId,
      repoOwner,
      repoName,
      provider,
      tokensUsed,
      version,
    });

    return new Response(JSON.stringify({ notes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
