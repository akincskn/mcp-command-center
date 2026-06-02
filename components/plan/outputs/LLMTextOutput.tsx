'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LLMTextOutput({ output }: { output: unknown }) {
  let text = '';
  if (typeof output === 'object' && output !== null && 'text' in output) {
    text = String((output as { text: unknown }).text);
  } else if (typeof output === 'string') {
    text = output;
  } else if (Array.isArray(output)) {
    const first = output[0];
    if (first && typeof first === 'object' && 'data' in first) {
      text = String((first as { data: unknown }).data);
    }
  }

  if (!text) return <p className="text-xs text-muted-foreground">No output text.</p>;

  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-code:text-emerald-400 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-pre:bg-muted/60 prose-pre:border prose-pre:border-border prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-li:text-foreground/90 prose-ul:my-2 prose-ol:my-2 prose-table:text-xs prose-table:border-collapse prose-thead:bg-muted/50 prose-th:border prose-th:border-border prose-th:bg-muted/30 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:align-top">
      <div className="overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
