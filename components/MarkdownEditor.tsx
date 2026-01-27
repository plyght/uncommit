"use client";

import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: Props) {
  const initialConfig = {
    namespace: "uncommit-markdown",
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <div className="editor">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorInitializer value={value} />
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Write changelog notes...</div>}
        />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              const markdown = $convertToMarkdownString(TRANSFORMERS);
              onChange(markdown);
            });
          }}
        />
      </LexicalComposer>
    </div>
  );
}

function EditorInitializer({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS);
    });
  }, [editor, value]);

  return null;
}
