// src/app/_components/ai-sidebar/index.ts
export {
  AISidebarProvider,
  useAISidebar,
  clampWidth,
  type AISidebarState,
  type AISidebarContextValue,
} from "./provider";

export { AISidebarPanel } from "./panel";

export { SidebarHeader } from "./header";

export {
  ContextStrip,
  truncate,
  getQuickActions,
  getViewName,
} from "./context-strip";

export {
  MessageBubble,
  renderMarkdown,
  type MessageBubbleProps,
} from "./message-bubble";

export {
  ThreadView,
  shouldAutoScroll,
  getSuggestionChips,
} from "./thread-view";

export {
  InputBar,
  clampTextareaHeight,
  canSubmit,
  type InputBarProps,
} from "./input-bar";

export {
  StatusFooter,
  type ConnectionStatus,
  type StatusFooterProps,
} from "./status-footer";

export {
  useToolCallManager,
  toolCallReducer,
  getToolClassification,
  getToolMetadata,
  getBadgeColor,
  TOOL_CLASSIFICATION,
  type ToolCallStatus,
  type ToolCallState,
  type ToolCallAction,
  type ToolCallManagerState,
} from "./use-tool-call-manager";

export {
  ToolCallCard,
  type ToolCallCardProps,
} from "./tool-call-card";

export {
  ChatContainer,
  type ChatContainerProps,
} from "./chat-container";

export {
  HistoryPanel,
  formatConversationDate,
} from "./history-panel";

export { SettingsPanel } from "./settings-panel";