import crypto from "crypto";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

function getPrivateKey() {
  const key = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!key) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is required");
  }
  return key.replace(/\\n/g, "\n");
}

export function verifyGitHubWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is required");
  }
  if (!signatureHeader) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export async function getInstallationOctokit(installationId: number) {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("GITHUB_APP_ID is required");
  }

  const auth = createAppAuth({
    appId,
    privateKey: getPrivateKey(),
  });

  const installation = await auth({
    type: "installation",
    installationId,
  });

  return new Octokit({ auth: installation.token });
}
