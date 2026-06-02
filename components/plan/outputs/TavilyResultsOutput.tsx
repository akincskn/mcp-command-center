'use client';

interface WebResult {
  title?: string;
  url?: string;
  snippet?: string;
  score?: number;
}

export function TavilyResultsOutput({ output }: { output: unknown }) {
  let results: WebResult[] = [];

  if (Array.isArray(output)) {
    const first = output[0];
    if (first && typeof first === 'object' && 'data' in first && Array.isArray((first as { data: unknown }).data)) {
      results = (first as { data: WebResult[] }).data;
    } else {
      results = output as WebResult[];
    }
  } else if (typeof output === 'object' && output !== null && 'data' in output) {
    const d = (output as { data: unknown }).data;
    if (Array.isArray(d)) results = d;
  }

  if (results.length === 0) {
    return <p className="text-xs text-muted-foreground">No results.</p>;
  }

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <a
          key={i}
          href={r.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md border border-border bg-card/40 p-3 hover:bg-card/60 transition-colors"
        >
          <p className="text-sm font-medium leading-snug line-clamp-1">{r.title}</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 truncate">{r.url}</p>
          {r.snippet && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.snippet}</p>
          )}
        </a>
      ))}
    </div>
  );
}
