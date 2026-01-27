import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { encryptSecret } from "./encryption";
import { getAuthUserId } from "@convex-dev/auth/server";

const WORKFLOW_ANTHROPIC = `name: AI Release Notes

on:
  push:
    branches: [main, master]
    paths:
      - 'package.json'
      - 'Cargo.toml'
      - 'pyproject.toml'
      - 'version.txt'
      - 'VERSION'

permissions:
  contents: write

jobs:
  check-version:
    name: Check version bump
    runs-on: ubuntu-latest
    outputs:
      should_release: \${{ steps.check.outputs.should_release }}
      version: \${{ steps.check.outputs.version }}
      prev_tag: \${{ steps.check.outputs.prev_tag }}
      pkg_type: \${{ steps.check.outputs.pkg_type }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect version change
        id: check
        run: |
          get_version() {
            if [ -f "package.json" ]; then
              echo "pkg_type=node" >> $GITHUB_OUTPUT
              jq -r '.version' package.json
            elif [ -f "Cargo.toml" ]; then
              echo "pkg_type=rust" >> $GITHUB_OUTPUT
              grep '^version' Cargo.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
            elif [ -f "pyproject.toml" ]; then
              echo "pkg_type=python" >> $GITHUB_OUTPUT
              grep '^version' pyproject.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
            elif [ -f "version.txt" ]; then
              echo "pkg_type=txt" >> $GITHUB_OUTPUT
              cat version.txt | tr -d '[:space:]'
            elif [ -f "VERSION" ]; then
              echo "pkg_type=txt" >> $GITHUB_OUTPUT
              cat VERSION | tr -d '[:space:]'
            else
              echo ""
            fi
          }
          
          CURRENT=$(get_version)
          echo "Current version: $CURRENT"
          
          if [ -z "$CURRENT" ]; then
            echo "No version file found"
            echo "should_release=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          
          git show HEAD^:package.json 2>/dev/null > /tmp/old_pkg.json || true
          git show HEAD^:Cargo.toml 2>/dev/null > /tmp/old_cargo.toml || true
          git show HEAD^:pyproject.toml 2>/dev/null > /tmp/old_pyproject.toml || true
          git show HEAD^:version.txt 2>/dev/null > /tmp/old_version.txt || true
          git show HEAD^:VERSION 2>/dev/null > /tmp/old_VERSION || true
          
          get_old_version() {
            if [ -f "package.json" ] && [ -s /tmp/old_pkg.json ]; then
              jq -r '.version' /tmp/old_pkg.json 2>/dev/null || echo "0.0.0"
            elif [ -f "Cargo.toml" ] && [ -s /tmp/old_cargo.toml ]; then
              grep '^version' /tmp/old_cargo.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/' || echo "0.0.0"
            elif [ -f "pyproject.toml" ] && [ -s /tmp/old_pyproject.toml ]; then
              grep '^version' /tmp/old_pyproject.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/' || echo "0.0.0"
            elif [ -f "version.txt" ] && [ -s /tmp/old_version.txt ]; then
              cat /tmp/old_version.txt | tr -d '[:space:]'
            elif [ -f "VERSION" ] && [ -s /tmp/old_VERSION ]; then
              cat /tmp/old_VERSION | tr -d '[:space:]'
            else
              echo "0.0.0"
            fi
          }
          
          PREVIOUS=$(get_old_version)
          echo "Previous version: $PREVIOUS"
          
          PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          echo "Previous tag: $PREV_TAG"
          echo "prev_tag=$PREV_TAG" >> $GITHUB_OUTPUT
          
          if git ls-remote --tags origin | grep -q "refs/tags/v$CURRENT"; then
            echo "Tag v$CURRENT exists, skipping"
            echo "should_release=false" >> $GITHUB_OUTPUT
          elif [ "$CURRENT" != "$PREVIOUS" ]; then
            echo "Version changed: $PREVIOUS -> $CURRENT"
            echo "should_release=true" >> $GITHUB_OUTPUT
            echo "version=$CURRENT" >> $GITHUB_OUTPUT
          else
            echo "Version unchanged"
            echo "should_release=false" >> $GITHUB_OUTPUT
          fi

  release:
    name: Generate notes and release
    runs-on: ubuntu-latest
    needs: check-version
    if: needs.check-version.outputs.should_release == 'true'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate AI release notes
        id: notes
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          VERSION="\${{ needs.check-version.outputs.version }}"
          PREV_TAG="\${{ needs.check-version.outputs.prev_tag }}"
          
          if [ -n "$PREV_TAG" ]; then
            DIFF=$(git diff "$PREV_TAG"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 2>/dev/null | head -c 80000 || echo "")
          else
            FIRST=$(git rev-list --max-parents=0 HEAD)
            DIFF=$(git diff "$FIRST"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 2>/dev/null | head -c 80000 || echo "")
          fi
          
          if [ -z "$DIFF" ] || [ "$DIFF" = "" ]; then
            echo "notes=Maintenance release." >> $GITHUB_OUTPUT
            exit 0
          fi
          
          SYSTEM="Generate release notes from code diffs. Rules:\\n- No emojis\\n- No title (GitHub shows it)\\n- Minimal, concise, comprehensive\\n- Only sections with changes (omit empty ones)\\n- Markdown ## headers: Features, Fixes, Improvements, Breaking Changes\\n- User-facing changes only\\n- Version-only bump = \\"Maintenance release.\\""
          
          REQUEST=$(jq -n \\
            --arg system "$SYSTEM" \\
            --arg diff "Generate release notes for v$VERSION.\\n\\nCode diff:\\n$DIFF" \\
            '{
              "model": "claude-haiku-4-5",
              "max_tokens": 2000,
              "system": $system,
              "messages": [{"role": "user", "content": $diff}]
            }')
          
          RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \\
            -H "Content-Type: application/json" \\
            -H "x-api-key: $ANTHROPIC_API_KEY" \\
            -H "anthropic-version: 2023-06-01" \\
            -d "$REQUEST")
          
          NOTES=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')
          
          if [ -z "$NOTES" ]; then
            NOTES="Maintenance release."
          fi
          
          echo "$NOTES" > /tmp/notes.md
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          cat /tmp/notes.md >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create tag
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a "v\${{ needs.check-version.outputs.version }}" -m "v\${{ needs.check-version.outputs.version }}"
          git push origin "v\${{ needs.check-version.outputs.version }}"

      - name: Create release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v\${{ needs.check-version.outputs.version }}
          name: v\${{ needs.check-version.outputs.version }}
          body: \${{ steps.notes.outputs.notes }}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

const WORKFLOW_OPENAI = `name: AI Release Notes

on:
  push:
    branches: [main, master]
    paths:
      - 'package.json'
      - 'Cargo.toml'
      - 'pyproject.toml'
      - 'version.txt'
      - 'VERSION'

permissions:
  contents: write

jobs:
  check-version:
    name: Check version bump
    runs-on: ubuntu-latest
    outputs:
      should_release: \${{ steps.check.outputs.should_release }}
      version: \${{ steps.check.outputs.version }}
      prev_tag: \${{ steps.check.outputs.prev_tag }}
      pkg_type: \${{ steps.check.outputs.pkg_type }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect version change
        id: check
        run: |
          get_version() {
            if [ -f "package.json" ]; then
              echo "pkg_type=node" >> $GITHUB_OUTPUT
              jq -r '.version' package.json
            elif [ -f "Cargo.toml" ]; then
              echo "pkg_type=rust" >> $GITHUB_OUTPUT
              grep '^version' Cargo.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
            elif [ -f "pyproject.toml" ]; then
              echo "pkg_type=python" >> $GITHUB_OUTPUT
              grep '^version' pyproject.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
            elif [ -f "version.txt" ]; then
              echo "pkg_type=txt" >> $GITHUB_OUTPUT
              cat version.txt | tr -d '[:space:]'
            elif [ -f "VERSION" ]; then
              echo "pkg_type=txt" >> $GITHUB_OUTPUT
              cat VERSION | tr -d '[:space:]'
            else
              echo ""
            fi
          }
          
          CURRENT=$(get_version)
          echo "Current version: $CURRENT"
          
          if [ -z "$CURRENT" ]; then
            echo "No version file found"
            echo "should_release=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          
          git show HEAD^:package.json 2>/dev/null > /tmp/old_pkg.json || true
          git show HEAD^:Cargo.toml 2>/dev/null > /tmp/old_cargo.toml || true
          git show HEAD^:pyproject.toml 2>/dev/null > /tmp/old_pyproject.toml || true
          git show HEAD^:version.txt 2>/dev/null > /tmp/old_version.txt || true
          git show HEAD^:VERSION 2>/dev/null > /tmp/old_VERSION || true
          
          get_old_version() {
            if [ -f "package.json" ] && [ -s /tmp/old_pkg.json ]; then
              jq -r '.version' /tmp/old_pkg.json 2>/dev/null || echo "0.0.0"
            elif [ -f "Cargo.toml" ] && [ -s /tmp/old_cargo.toml ]; then
              grep '^version' /tmp/old_cargo.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/' || echo "0.0.0"
            elif [ -f "pyproject.toml" ] && [ -s /tmp/old_pyproject.toml ]; then
              grep '^version' /tmp/old_pyproject.toml | head -1 | sed 's/.*"\\(.*\\)".*/\\1/' || echo "0.0.0"
            elif [ -f "version.txt" ] && [ -s /tmp/old_version.txt ]; then
              cat /tmp/old_version.txt | tr -d '[:space:]'
            elif [ -f "VERSION" ] && [ -s /tmp/old_VERSION ]; then
              cat /tmp/old_VERSION | tr -d '[:space:]'
            else
              echo "0.0.0"
            fi
          }
          
          PREVIOUS=$(get_old_version)
          echo "Previous version: $PREVIOUS"
          
          PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          echo "Previous tag: $PREV_TAG"
          echo "prev_tag=$PREV_TAG" >> $GITHUB_OUTPUT
          
          if git ls-remote --tags origin | grep -q "refs/tags/v$CURRENT"; then
            echo "Tag v$CURRENT exists, skipping"
            echo "should_release=false" >> $GITHUB_OUTPUT
          elif [ "$CURRENT" != "$PREVIOUS" ]; then
            echo "Version changed: $PREVIOUS -> $CURRENT"
            echo "should_release=true" >> $GITHUB_OUTPUT
            echo "version=$CURRENT" >> $GITHUB_OUTPUT
          else
            echo "Version unchanged"
            echo "should_release=false" >> $GITHUB_OUTPUT
          fi

  release:
    name: Generate notes and release
    runs-on: ubuntu-latest
    needs: check-version
    if: needs.check-version.outputs.should_release == 'true'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate AI release notes
        id: notes
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        run: |
          VERSION="\${{ needs.check-version.outputs.version }}"
          PREV_TAG="\${{ needs.check-version.outputs.prev_tag }}"
          
          if [ -n "$PREV_TAG" ]; then
            DIFF=$(git diff "$PREV_TAG"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 2>/dev/null | head -c 80000 || echo "")
          else
            FIRST=$(git rev-list --max-parents=0 HEAD)
            DIFF=$(git diff "$FIRST"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 2>/dev/null | head -c 80000 || echo "")
          fi
          
          if [ -z "$DIFF" ] || [ "$DIFF" = "" ]; then
            echo "notes=Maintenance release." >> $GITHUB_OUTPUT
            exit 0
          fi
          
          REQUEST=$(jq -n \\
            --arg diff "Generate release notes for v$VERSION.\\n\\nCode diff:\\n$DIFF" \\
            '{
              "model": "gpt-5.2",
              "messages": [
                {
                  "role": "system",
                  "content": "Generate release notes from code diffs. Rules:\\n- No emojis\\n- No title (GitHub shows it)\\n- Minimal, concise, comprehensive\\n- Only sections with changes (omit empty ones)\\n- Markdown ## headers: Features, Fixes, Improvements, Breaking Changes\\n- User-facing changes only\\n- Version-only bump = \\"Maintenance release.\\""
                },
                {"role": "user", "content": $diff}
              ],
              "max_completion_tokens": 2000
            }')
          
          RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer $OPENAI_API_KEY" \\
            -d "$REQUEST")
          
          NOTES=$(echo "$RESPONSE" | jq -r '.choices[0].message.content // empty')
          
          if [ -z "$NOTES" ]; then
            NOTES="Maintenance release."
          fi
          
          echo "$NOTES" > /tmp/notes.md
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          cat /tmp/notes.md >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create tag
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a "v\${{ needs.check-version.outputs.version }}" -m "v\${{ needs.check-version.outputs.version }}"
          git push origin "v\${{ needs.check-version.outputs.version }}"

      - name: Create release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v\${{ needs.check-version.outputs.version }}
          name: v\${{ needs.check-version.outputs.version }}
          body: \${{ steps.notes.outputs.notes }}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

export const saveInstallation = internalMutation({
  args: {
    userId: v.id("users"),
    repoOwner: v.string(),
    repoName: v.string(),
    aiProvider: v.string(),
  },
  handler: async (ctx, { userId, repoOwner, repoName, aiProvider }) => {
    const existing = await ctx.db
      .query("installations")
      .withIndex("by_user_and_repo", (q) =>
        q.eq("userId", userId).eq("repoOwner", repoOwner).eq("repoName", repoName)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        aiProvider,
        installedAt: Date.now(),
      });
      return existing._id;
    }

    const installationId = await ctx.db.insert("installations", {
      userId,
      repoOwner,
      repoName,
      aiProvider,
      installedAt: Date.now(),
    });

    return installationId;
  },
});

export const installWorkflow = action({
  args: {
    repoOwner: v.string(),
    repoName: v.string(),
    aiProvider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, { repoOwner, repoName, aiProvider, apiKey }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken = user.githubAccessToken;

    const { key: publicKey, keyId } = await ctx.runAction(api.github.fetchRepoPublicKey, {
      accessToken,
      owner: repoOwner,
      repo: repoName,
    });

    const encryptedValue = encryptSecret(apiKey, publicKey);

    const secretName = aiProvider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";

    await ctx.runAction(api.github.createRepoSecret, {
      accessToken,
      owner: repoOwner,
      repo: repoName,
      secretName,
      encryptedValue,
      keyId,
    });

    const workflowContent = aiProvider === "anthropic" ? WORKFLOW_ANTHROPIC : WORKFLOW_OPENAI;

    await ctx.runAction(api.github.createWorkflowFile, {
      accessToken,
      owner: repoOwner,
      repo: repoName,
      content: workflowContent,
      aiProvider,
    });

    await ctx.runMutation(internal.install.saveInstallation, {
      userId,
      repoOwner,
      repoName,
      aiProvider,
    });

    return {
      success: true,
      message: `Successfully installed ${aiProvider} workflow to ${repoOwner}/${repoName}`,
    };
  },
});
