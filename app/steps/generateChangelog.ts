type GeneratePayload = {
  version: string;
  diff: string;
};

export async function generateChangelogStep({ version, diff }: GeneratePayload) {
  "use step";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !diff) {
    return "Maintenance release.";
  }

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate release notes from code diffs. Rules:\n- No emojis\n- No title (GitHub shows it)\n- Minimal, concise, comprehensive\n- Only sections with changes (omit empty ones)\n- Markdown ## headers: Features, Fixes, Improvements, Breaking Changes\n- User-facing changes only\n- Version-only bump = \"Maintenance release.\"",
      },
      {
        role: "user",
        content: `Generate release notes for v${version}.\n\nCode diff:\n${diff}`,
      },
    ],
    max_completion_tokens: 1000,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    return "Maintenance release.";
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim().length > 0 ? content : "Maintenance release.";
}
