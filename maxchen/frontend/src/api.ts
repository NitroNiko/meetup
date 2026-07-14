import type { ChatResponse, MemorySnapshot, ToolResult } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export function sendChat(message: string, toolName?: string, toolPayload: Record<string, unknown> = {}) {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, tool_name: toolName, tool_payload: toolPayload }),
  });
}

export function getMemory() {
  return request<MemorySnapshot>("/api/memory");
}

export function summarizeFile(filename: string, content: string) {
  return request<ToolResult>("/api/tools/files/summarize", {
    method: "POST",
    body: JSON.stringify({ filename, content }),
  });
}

export function webRequest(url: string) {
  return request<ToolResult>("/api/tools/web-request", {
    method: "POST",
    body: JSON.stringify({ url, method: "GET" }),
  });
}

export { API_BASE };

