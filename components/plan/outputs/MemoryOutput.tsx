'use client';

interface MemoryItem {
  id?: string;
  key?: string;
  value?: unknown;
  tags?: string[];
}

export function MemoryOutput({ output }: { output: unknown }) {
  let memories: MemoryItem[] = [];

  if (Array.isArray(output)) {
    const first = output[0];
    if (first && typeof first === 'object' && 'data' in first) {
      const data = (first as { data: unknown }).data;
      memories = Array.isArray(data) ? (data as MemoryItem[]) : ([data] as MemoryItem[]);
    } else {
      memories = output as MemoryItem[];
    }
  } else if (typeof output === 'object' && output !== null) {
    if ('data' in output) {
      const data = (output as { data: unknown }).data;
      memories = Array.isArray(data) ? (data as MemoryItem[]) : ([data] as MemoryItem[]);
    } else {
      memories = [output as MemoryItem];
    }
  }

  if (memories.length === 0) {
    return <p className="text-xs text-muted-foreground">No memories.</p>;
  }

  return (
    <div className="space-y-2">
      {memories.map((m, i) => (
        <div key={m.id ?? i} className="rounded-md border border-border bg-card/40 p-3">
          {m.key && (
            <div className="flex items-center gap-2 mb-1.5">
              <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{m.key}</code>
              {m.tags && m.tags.length > 0 && (
                <div className="flex gap-1">
                  {m.tags.slice(0, 3).map((t, j) => (
                    <span key={j} className="text-[10px] text-muted-foreground">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {m.value !== undefined && (
            <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-words max-h-32 overflow-y-auto font-sans">
              {typeof m.value === 'object' ? JSON.stringify(m.value, null, 2) : String(m.value)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
