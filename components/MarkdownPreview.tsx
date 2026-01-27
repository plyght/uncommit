"use client";

import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";

type Props = {
  markdown: string;
};

export function MarkdownPreview({ markdown }: Props) {
  const initialConfig = {
    namespace: "uncommit-markdown-preview",
    editable: false,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <div className="markdown-preview">
      <LexicalComposer initialConfig={initialConfig}>
        <PreviewInitializer markdown={markdown} />
        <RichTextPlugin contentEditable={<ContentEditable className="markdown-editor" />} placeholder={null} />
      </LexicalComposer>
    </div>
  );
}

function PreviewInitializer({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(markdown, TRANSFORMERS);
    });
  }, [editor, markdown]);

  return null;
}
