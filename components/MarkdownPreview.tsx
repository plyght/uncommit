"use client";

import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $getRoot } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { lexicalTheme } from "@/components/lexicalTheme";

type Props = {
  markdown: string;
};

export function MarkdownPreview({ markdown }: Props) {
  const initialConfig = {
    namespace: "uncommit-markdown-preview",
    editable: false,
    theme: lexicalTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <div className="rounded-[var(--radius)] bg-transparent">
      <LexicalComposer initialConfig={initialConfig}>
        <PreviewInitializer markdown={markdown} />
        <RichTextPlugin
          contentEditable={
            <div className="px-0 py-0">
              <ContentEditable dir="ltr" className="text-left text-[1rem] leading-[1.7] text-[var(--fg)] outline-none" />
            </div>
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  );
}

function PreviewInitializer({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext();
  const lastValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastValueRef.current === markdown) return;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(markdown, TRANSFORMERS);
      lastValueRef.current = markdown;
    });
  }, [editor, markdown]);

  return null;
}
