'use client';

interface Issue {
  number?: number;
  title?: string;
  url?: string;
  state?: string;
  labels?: string[];
}

export function GithubIssuesOutput({ output }: { output: unknown }) {
  let issues: Issue[] = [];

  if (Array.isArray(output)) {
    const first = output[0];
    if (first && typeof first === 'object' && 'data' in first && Array.isArray((first as { data: unknown }).data)) {
      issues = (first as { data: Issue[] }).data;
    } else {
      issues = output as Issue[];
    }
  } else if (typeof output === 'object' && output !== null && 'data' in output) {
    const d = (output as { data: unknown }).data;
    if (Array.isArray(d)) issues = d;
  }

  if (issues.length === 0) {
    return <p className="text-xs text-muted-foreground">No issues found.</p>;
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, i) => (
        <a
          key={issue.number ?? i}
          href={issue.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md border border-border bg-card/40 p-3 hover:bg-card/60 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {issue.number !== undefined && (
                  <span className="text-muted-foreground font-mono mr-2">#{issue.number}</span>
                )}
                {issue.title}
              </p>
              {issue.labels && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {issue.labels.slice(0, 4).map((label, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {issue.state && (
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                {issue.state}
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
