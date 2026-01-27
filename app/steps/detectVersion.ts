import { getInstallationOctokit } from "@/lib/githubApp";

type DetectPayload = {
  installationId?: number;
  repoOwner: string;
  repoName: string;
  beforeSha: string;
  afterSha: string;
  versionSource: string;
  versionStrategy: string;
};

function parseSemver(version: string) {
  const clean = version.replace(/^v/, "");
  const [major, minor, patch] = clean.split(".");
  return {
    major: Number(major || 0),
    minor: Number(minor || 0),
    patch: Number(patch || 0),
  };
}

function isMajorIncrease(prev: string, next: string) {
  const prevSemver = parseSemver(prev);
  const nextSemver = parseSemver(next);
  return nextSemver.major > prevSemver.major;
}

async function getFileContent(
  installationId: number | undefined,
  repoOwner: string,
  repoName: string,
  path: string,
  ref: string
) {
  if (!installationId) return null;
  const octokit = await getInstallationOctokit(installationId);
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: repoOwner,
      repo: repoName,
      path,
      ref,
    });
    if (Array.isArray(response.data) || !("content" in response.data)) return null;
    const content = Buffer.from(response.data.content, "base64").toString("utf8");
    return content;
  } catch {
    return null;
  }
}

function extractVersionFromJson(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.version === "string") return parsed.version;
  } catch {
    return null;
  }
  return null;
}

function extractVersionFromToml(raw: string) {
  const match = raw.match(/version\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}

function extractVersionFromText(raw: string) {
  return raw.trim();
}

async function detectVersionAtRef(
  installationId: number | undefined,
  repoOwner: string,
  repoName: string,
  ref: string,
  versionSource: string
) {
  if (versionSource === "uncommit") {
    const raw = await getFileContent(installationId, repoOwner, repoName, "uncommit.json", ref);
    return raw ? extractVersionFromJson(raw) : null;
  }

  const packageJson = await getFileContent(installationId, repoOwner, repoName, "package.json", ref);
  if (packageJson) return extractVersionFromJson(packageJson);

  const cargoToml = await getFileContent(installationId, repoOwner, repoName, "Cargo.toml", ref);
  if (cargoToml) return extractVersionFromToml(cargoToml);

  const pyproject = await getFileContent(installationId, repoOwner, repoName, "pyproject.toml", ref);
  if (pyproject) return extractVersionFromToml(pyproject);

  const versionTxt = await getFileContent(installationId, repoOwner, repoName, "version.txt", ref);
  if (versionTxt) return extractVersionFromText(versionTxt);

  const versionFile = await getFileContent(installationId, repoOwner, repoName, "VERSION", ref);
  if (versionFile) return extractVersionFromText(versionFile);

  return null;
}

export async function detectVersionStep(payload: DetectPayload) {
  "use step";

  const currentVersion = await detectVersionAtRef(
    payload.installationId,
    payload.repoOwner,
    payload.repoName,
    payload.afterSha,
    payload.versionSource
  );
  const previousVersion = await detectVersionAtRef(
    payload.installationId,
    payload.repoOwner,
    payload.repoName,
    payload.beforeSha,
    payload.versionSource
  );

  if (!currentVersion || currentVersion === previousVersion) {
    return { shouldRelease: false, version: currentVersion ?? "" };
  }

  if (payload.versionStrategy === "major-only") {
    const isMajor = previousVersion ? isMajorIncrease(previousVersion, currentVersion) : true;
    if (!isMajor) {
      return { shouldRelease: false, version: currentVersion };
    }
  }

  return { shouldRelease: true, version: currentVersion };
}
