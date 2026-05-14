export interface ToolContext {
  userId: string;
  planId?: string;
  stepId?: string;
  githubToken?: string;
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'json';
    data: unknown;
  }>;
  isError?: boolean;
  metadata?: {
    durationMs?: number;
    sourceUrl?: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

export type ToolName =
  | 'github.list_issues'
  | 'github.get_repo'
  | 'github.search_code'
  | 'github.get_file_content'
  | 'tavily.web_search'
  | 'tavily.web_fetch'
  | 'memory.recall'
  | 'memory.store'
  | 'memory.list';
