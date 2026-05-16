import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string;
}

export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <p className="text-xs font-mono text-muted-foreground/60">
          Coming in {phase}
        </p>
      </div>
    </div>
  );
}
