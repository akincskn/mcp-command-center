'use client';

export function JsonFallback({ output }: { output: unknown }) {
  let str: string;
  try {
    str = JSON.stringify(output, null, 2);
  } catch {
    str = String(output);
  }

  return (
    <pre className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md overflow-x-auto max-h-64 overflow-y-auto">
      {str}
    </pre>
  );
}
