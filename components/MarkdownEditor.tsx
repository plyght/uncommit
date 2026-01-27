"use client";

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode } from "@lexical/list";
import { CodeNode, $createCodeNode, $isCodeNode } from "@lexical/code";
import { LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { $getSelection, $createParagraphNode, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $getNearestNodeOfType } from "@lexical/utils";
import { lexicalTheme } from "@/components/lexicalTheme";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: Props) {
  const initialConfig = {
    namespace: "uncommit-markdown",
    theme: lexicalTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)]">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorToolbar />
        <EditorInitializer value={value} />
        <RichTextPlugin
          contentEditable={
            <div className="max-h-[720px] overflow-auto px-4 py-4">
              <ContentEditable dir="ltr" className="min-h-[420px] text-left text-[0.875rem] text-[var(--fg)] outline-none" />
            </div>
          }
          placeholder={
            <div className="pointer-events-none absolute left-4 top-[3.35rem] text-[0.875rem] opacity-50">
              Write changelog notes...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
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

function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));

        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();

        const formatType = element.getFormatType();
        if (formatType === "center" || formatType === "right") {
          setAlignment(formatType);
        } else {
          setAlignment("left");
        }

        if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
          return;
        }

        if ($isQuoteNode(element)) {
          setBlockType("quote");
          return;
        }

        if ($isCodeNode(element)) {
          setBlockType("code");
          return;
        }

        const listNode = $getNearestNodeOfType(anchorNode, ListNode);
        if (listNode && $isListNode(listNode)) {
          setBlockType(listNode.getListType());
          return;
        }

        setBlockType("paragraph");
      });
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsLink(false);
          return;
        }
        const node = selection.anchor.getNode();
        const linkParent = $getNearestNodeOfType(node, LinkNode);
        setIsLink($isLinkNode(linkParent));
      });
    });
  }, [editor]);

  const applyParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const applyHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const applyQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const applyCode = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const toggleList = (type: "bullet" | "number") => {
    if (type === "bullet") {
      if (blockType === "bullet") {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        return;
      }
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }
    if (blockType === "number") {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      return;
    }
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const toggleLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    const url = window.prompt("Enter a URL");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  return (
    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] bg-[var(--gray-100)] px-3 py-2">
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "paragraph" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={applyParagraph}
        >
          P
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "h1" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => applyHeading("h1")}
        >
          H1
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "h2" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => applyHeading("h2")}
        >
          H2
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "h3" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => applyHeading("h3")}
        >
          H3
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${isBold ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          Bold
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${isItalic ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          Italic
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${isUnderline ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        >
          Underline
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "bullet" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => toggleList("bullet")}
        >
          Bullets
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "number" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => toggleList("number")}
        >
          Numbered
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "quote" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={applyQuote}
        >
          Quote
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${blockType === "code" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={applyCode}
        >
          Code
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${isLink ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={toggleLink}
        >
          Link
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${alignment === "left" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        >
          Left
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${alignment === "center" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        >
          Center
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius)] border px-2 py-1 text-[0.6875rem] transition-colors ${alignment === "right" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        >
          Right
        </button>
      </div>
    </div>
  );
}
