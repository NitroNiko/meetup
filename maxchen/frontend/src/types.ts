export type MemoryCategory = "preferences" | "tasks" | "projects" | "facts" | "calendar" | "files";

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  text: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface MemorySnapshot {
  user_name: string;
  preferences: MemoryEntry[];
  tasks: MemoryEntry[];
  projects: MemoryEntry[];
  facts: MemoryEntry[];
  calendar: MemoryEntry[];
  files: MemoryEntry[];
  interactions: Array<Record<string, unknown>>;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  data: Record<string, unknown>;
  error?: string;
}

export interface ChatResponse {
  assistant_name: string;
  reply: string;
  memory_updates: MemoryEntry[];
  tool_results: ToolResult[];
  suggestions: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

