declare module 'convex/browser' {
  export class ConvexHttpClient {
    constructor(url: string);
    query(query: any, args?: any): Promise<any>;
    mutation(mutation: any, args?: any): Promise<any>;
    action(action: any, args?: any): Promise<any>;
  }
}

declare module 'convex/react' {
  export const ConvexProvider: any;
  export const ConvexReactClient: any;
  export const useConvex: any;
  export const useQuery: any;
  export const useMutation: any;
  export const useAction: any;
  export const Authenticated: any;
  export const Unauthenticated: any;
  export const AuthLoading: any;
}

declare module 'convex/server' {
  export interface IndexRange {
    eq(field: string, value: any): IndexRange;
  }
  export type FunctionReference<T extends string = any> = any;
  export type OptionalRestArgs<T> = any;
  export const httpRouter: any;
  export const defineSchema: any;
  export const defineTable: any;
  export * from 'convex/dist/esm/server/index';
}

declare module 'convex/values' {
  export const v: any;
}

declare module '@convex-dev/auth/react' {
  export function useAuthActions(): {
    signIn: (provider: string, options?: any) => Promise<any>;
    signOut: () => Promise<void>;
  };
  export const ConvexAuthProvider: any;
}

declare module '@convex-dev/auth/server' {
  export const convexAuth: any;
  export function getAuthUserId(ctx: any): Promise<string | null>;
  export const authTables: any;
}

declare module '@convex-dev/auth/providers/Anonymous' {
  export const Anonymous: any;
}

declare module '@vercel/analytics/next' {
  export const Analytics: React.ComponentType;
}

declare module 'workflow/next' {
  export function withWorkflow<T extends Record<string, any>>(config: T): T;
}

declare module 'workflow/api' {
  export function start<T extends any[]>(workflow: (...args: T) => Promise<void>, args: T): Promise<void>;
}

declare module '@auth/core/providers/github' {
  export default function GitHub(config: any): any;
}

declare module '@base-ui/react/slider' {
  export * from '@base-ui/react';
}

declare module '@base-ui/react/select' {
  export * from '@base-ui/react';
}

declare module '@lexical/react/LexicalComposer' {
  export const LexicalComposer: any;
}

declare module '@lexical/react/LexicalRichTextPlugin' {
  export const RichTextPlugin: any;
}

declare module '@lexical/react/LexicalContentEditable' {
  export const ContentEditable: any;
}

declare module '@lexical/react/LexicalErrorBoundary' {
  export default function LexicalErrorBoundary(props: any): any;
  export { LexicalErrorBoundary };
}

declare module '@lexical/react/LexicalHistoryPlugin' {
  export const HistoryPlugin: any;
}

declare module '@lexical/react/LexicalOnChangePlugin' {
  export const OnChangePlugin: any;
}

declare module '@lexical/react/LexicalComposerContext' {
  export function useLexicalComposerContext(): any;
}

declare module '@lexical/react/LexicalLinkPlugin' {
  export const LinkPlugin: any;
}

declare module '@lexical/react/LexicalListPlugin' {
  export const ListPlugin: any;
}

declare module '@lexical/markdown' {
  export const TRANSFORMERS: any;
  export const $convertFromMarkdownString: any;
  export const $convertToMarkdownString: any;
}

declare module '@lexical/rich-text' {
  export const HeadingNode: any;
  export const QuoteNode: any;
  export const $createHeadingNode: any;
  export const $createQuoteNode: any;
  export const $isHeadingNode: any;
  export const $isQuoteNode: any;
}

declare module '@lexical/list' {
  export const ListNode: any;
  export const ListItemNode: any;
  export const INSERT_UNORDERED_LIST_COMMAND: any;
  export const INSERT_ORDERED_LIST_COMMAND: any;
  export const REMOVE_LIST_COMMAND: any;
  export const $isListNode: any;
}

declare module '@lexical/code' {
  export const CodeNode: any;
  export const CodeHighlightNode: any;
  export const $createCodeNode: any;
  export const $isCodeNode: any;
}

declare module '@lexical/link' {
  export const LinkNode: any;
  export const AutoLinkNode: any;
  export const TOGGLE_LINK_COMMAND: any;
  export const $isLinkNode: any;
}

declare module '@lexical/selection' {
  export const $isRangeSelection: any;
  export const $setBlocksType: any;
}

declare module '@lexical/utils' {
  export const mergeRegister: any;
  export const $getNearestNodeOfType: any;
}

declare module 'lexical' {
  export const $getRoot: any;
  export const $getSelection: any;
  export const $createParagraphNode: any;
  export const $createTextNode: any;
  export const $isRangeSelection: any;
  export const $isElementNode: any;
  export const COMMAND_PRIORITY_EDITOR: any;
  export const COMMAND_PRIORITY_LOW: any;
  export const FORMAT_TEXT_COMMAND: any;
  export const FORMAT_ELEMENT_COMMAND: any;
  export const SELECTION_CHANGE_COMMAND: any;
  export const KEY_MODIFIER_COMMAND: any;
  export interface EditorThemeClasses {
    [key: string]: any;
  }
  export interface LexicalEditor {
    [key: string]: any;
  }
  export interface EditorState {
    [key: string]: any;
  }
}
