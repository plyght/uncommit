import type { EditorThemeClasses } from "lexical";

export const lexicalTheme: EditorThemeClasses = {
  paragraph: "mb-3",
  heading: {
    h1: "mb-4 text-[1.6rem] font-semibold tracking-[-0.02em]",
    h2: "mb-3 text-[1.25rem] font-semibold tracking-[-0.02em]",
    h3: "mb-2 text-[1.05rem] font-semibold tracking-[-0.02em]",
  },
  list: {
    ul: "mb-3 ml-5 list-disc",
    ol: "mb-3 ml-5 list-decimal",
    listitem: "my-1",
    nested: {
      listitem: "ml-4",
    },
  },
  quote: "mb-3 border-l-2 border-[var(--border)] pl-3 text-[var(--gray-600)]",
  code: "mb-3 rounded-[var(--radius)] bg-[var(--gray-100)] p-3 font-mono text-[0.8125rem]",
  link: "text-[var(--accent)] underline",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    code: "rounded-[var(--radius)] bg-[var(--gray-100)] px-1.5 py-0.5 font-mono text-[0.8125rem]",
  },
};
