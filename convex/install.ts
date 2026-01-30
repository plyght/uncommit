import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
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
      - 'Version.swift'
      - 'version.swift'

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
          get_version_from_file() {
            local file=$1
            local pkg_type=$2
            
            case "$file" in
              "package.json")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  jq -r '.version' "$file"
                fi
                ;;
              "Cargo.toml")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep '^version' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "pyproject.toml")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep '^version' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "Version.swift"|"version.swift")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep -E '(let|var|static let|public static let)\\s+version\\s*=\\s*"' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "version.txt")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  cat "$file" | tr -d '[:space:]'
                fi
                ;;
              "VERSION")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  cat "$file" | tr -d '[:space:]'
                fi
                ;;
            esac
          }
          
          get_version() {
            local version=""
            version=$(get_version_from_file "package.json" "node")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "Cargo.toml" "rust")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "pyproject.toml" "python")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "Version.swift" "swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "version.swift" "swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "version.txt" "txt")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "VERSION" "txt")
            [ -n "$version" ] && echo "$version" && return
            echo ""
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
          git show HEAD^:Version.swift 2>/dev/null > /tmp/old_Version.swift || true
          git show HEAD^:version.swift 2>/dev/null > /tmp/old_version.swift || true
          git show HEAD^:version.txt 2>/dev/null > /tmp/old_version.txt || true
          git show HEAD^:VERSION 2>/dev/null > /tmp/old_VERSION || true
          
          get_old_version_from_file() {
            local file=$1
            local old_file=$2
            
            if [ ! -f "$file" ] || [ ! -s "$old_file" ]; then
              return
            fi
            
            case "$file" in
              "package.json")
                jq -r '.version' "$old_file" 2>/dev/null
                ;;
              "Cargo.toml")
                grep '^version' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "pyproject.toml")
                grep '^version' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "Version.swift"|"version.swift")
                grep -E '(let|var|static let|public static let)\\s+version\\s*=\\s*"' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "version.txt")
                cat "$old_file" | tr -d '[:space:]'
                ;;
              "VERSION")
                cat "$old_file" | tr -d '[:space:]'
                ;;
            esac
          }
          
          get_old_version() {
            local version=""
            version=$(get_old_version_from_file "package.json" "/tmp/old_pkg.json")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "Cargo.toml" "/tmp/old_cargo.toml")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "pyproject.toml" "/tmp/old_pyproject.toml")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "Version.swift" "/tmp/old_Version.swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "version.swift" "/tmp/old_version.swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "version.txt" "/tmp/old_version.txt")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "VERSION" "/tmp/old_VERSION")
            [ -n "$version" ] && echo "$version" && return
            echo "0.0.0"
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
            DIFF=$(git diff "$PREV_TAG"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 'Version.swift' 'version.swift' 2>/dev/null | head -c 80000 || echo "")
          else
            FIRST=$(git rev-list --max-parents=0 HEAD)
            DIFF=$(git diff "$FIRST"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 'Version.swift' 'version.swift' 2>/dev/null | head -c 80000 || echo "")
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
      - 'Version.swift'
      - 'version.swift'

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
          get_version_from_file() {
            local file=$1
            local pkg_type=$2
            
            case "$file" in
              "package.json")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  jq -r '.version' "$file"
                fi
                ;;
              "Cargo.toml")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep '^version' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "pyproject.toml")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep '^version' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "Version.swift"|"version.swift")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  grep -E '(let|var|static let|public static let)\\s+version\\s*=\\s*"' "$file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                fi
                ;;
              "version.txt")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  cat "$file" | tr -d '[:space:]'
                fi
                ;;
              "VERSION")
                if [ -f "$file" ]; then
                  echo "pkg_type=$pkg_type" >> $GITHUB_OUTPUT
                  cat "$file" | tr -d '[:space:]'
                fi
                ;;
            esac
          }
          
          get_version() {
            local version=""
            version=$(get_version_from_file "package.json" "node")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "Cargo.toml" "rust")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "pyproject.toml" "python")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "Version.swift" "swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "version.swift" "swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "version.txt" "txt")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_version_from_file "VERSION" "txt")
            [ -n "$version" ] && echo "$version" && return
            echo ""
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
          git show HEAD^:Version.swift 2>/dev/null > /tmp/old_Version.swift || true
          git show HEAD^:version.swift 2>/dev/null > /tmp/old_version.swift || true
          git show HEAD^:version.txt 2>/dev/null > /tmp/old_version.txt || true
          git show HEAD^:VERSION 2>/dev/null > /tmp/old_VERSION || true
          
          get_old_version_from_file() {
            local file=$1
            local old_file=$2
            
            if [ ! -f "$file" ] || [ ! -s "$old_file" ]; then
              return
            fi
            
            case "$file" in
              "package.json")
                jq -r '.version' "$old_file" 2>/dev/null
                ;;
              "Cargo.toml")
                grep '^version' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "pyproject.toml")
                grep '^version' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "Version.swift"|"version.swift")
                grep -E '(let|var|static let|public static let)\\s+version\\s*=\\s*"' "$old_file" | head -1 | sed 's/.*"\\(.*\\)".*/\\1/'
                ;;
              "version.txt")
                cat "$old_file" | tr -d '[:space:]'
                ;;
              "VERSION")
                cat "$old_file" | tr -d '[:space:]'
                ;;
            esac
          }
          
          get_old_version() {
            local version=""
            version=$(get_old_version_from_file "package.json" "/tmp/old_pkg.json")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "Cargo.toml" "/tmp/old_cargo.toml")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "pyproject.toml" "/tmp/old_pyproject.toml")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "Version.swift" "/tmp/old_Version.swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "version.swift" "/tmp/old_version.swift")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "version.txt" "/tmp/old_version.txt")
            [ -n "$version" ] && echo "$version" && return
            version=$(get_old_version_from_file "VERSION" "/tmp/old_VERSION")
            [ -n "$version" ] && echo "$version" && return
            echo "0.0.0"
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
            DIFF=$(git diff "$PREV_TAG"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 'Version.swift' 'version.swift' 2>/dev/null | head -c 80000 || echo "")
          else
            FIRST=$(git rev-list --max-parents=0 HEAD)
            DIFF=$(git diff "$FIRST"..HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.rs' '*.py' '*.go' '*.java' '*.rb' '*.php' '*.cs' '*.swift' '*.kt' 'package.json' 'Cargo.toml' 'pyproject.toml' 'Version.swift' 'version.swift' 2>/dev/null | head -c 80000 || echo "")
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
    encryptedApiKey: v.string(),
    keyId: v.string(),
  },
  handler: async (ctx, { repoOwner, repoName, aiProvider, encryptedApiKey, keyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const secretName = aiProvider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";

    await ctx.runAction(api.github.createRepoSecret, {
      owner: repoOwner,
      repo: repoName,
      secretName,
      encryptedValue: encryptedApiKey,
      keyId,
    });

    const workflowContent = aiProvider === "anthropic" ? WORKFLOW_ANTHROPIC : WORKFLOW_OPENAI;

    await ctx.runAction(api.github.createWorkflowFile, {
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
