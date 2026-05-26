import { PlanHistory } from '@/components/history/PlanHistory';

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and re-run your previously executed plans.
        </p>
      </div>

      <PlanHistory />
    </div>
  );
}
