import type { MCPTool, ToolName } from './types';
import { githubListIssues, githubGetRepo, githubSearchCode, githubGetFile } from './github';
import { tavilyWebSearch, tavilyWebFetch } from './tavily';
import { memoryRecall, memoryStore, memoryList } from './memory';

export const toolRegistry: Record<ToolName, MCPTool> = {
  'github.list_issues': githubListIssues,
  'github.get_repo': githubGetRepo,
  'github.search_code': githubSearchCode,
  'github.get_file_content': githubGetFile,
  'tavily.web_search': tavilyWebSearch,
  'tavily.web_fetch': tavilyWebFetch,
  'memory.recall': memoryRecall,
  'memory.store': memoryStore,
  'memory.list': memoryList,
};

export function getTool(name: string): MCPTool | undefined {
  return toolRegistry[name as ToolName];
}

export function listTools(): MCPTool[] {
  return Object.values(toolRegistry);
}
