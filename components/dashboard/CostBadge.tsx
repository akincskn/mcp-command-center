import { Skeleton } from '@/components/ui/skeleton';

interface CostBadgeProps {
  loading?: boolean;
}

export function CostBadge({ loading = false }: CostBadgeProps) {
  if (loading) {
    return <Skeleton className="h-6 w-16 rounded-full" />;
  }

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
      $0.00
    </span>
  );
}
