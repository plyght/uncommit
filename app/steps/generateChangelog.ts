type GeneratePayload = {
  version: string;
  previousVersion?: string;
  beforeSha: string;
  afterSha: string;
};

export async function generateChangelogStep({ version, previousVersion, beforeSha, afterSha }: GeneratePayload) {
  "use step";

  const shortBefore = beforeSha?.slice(0, 10) || "unknown";
  const shortAfter = afterSha?.slice(0, 10) || "unknown";
  const prevLabel = previousVersion ? `v${previousVersion}` : "previous";

  return [
    `## Release summary (demo)`,
    ``,
    `${prevLabel} commit id: ${shortBefore}`,
    `v${version} commit id: ${shortAfter}`,
    ``,
    `## Features`,
    `- Added project switcher with a single control in the sidebar.`,
    `- Introduced multi-project navigation with a streamlined dashboard shell.`,
    ``,
    `## Improvements`,
    `- Polished settings workflow to re-edit repo configuration in-app.`,
    `- Refined navigation hierarchy for release notes and changelogs.`,
    ``,
    `## Fixes`,
    `- Resolved setup flow edge cases for project selection.`,
    ``,
    `## Breaking Changes`,
    `- None.`,
  ].join("\n");
}
