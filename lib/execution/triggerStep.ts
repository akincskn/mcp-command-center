const INTERNAL_SECRET = process.env.INTERNAL_SECRET!;
const BASE_URL = process.env.NEXTAUTH_URL!;

export async function triggerStep(stepId: string): Promise<void> {
  void fetch(`${BASE_URL}/api/step/${stepId}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
  }).catch((err) => {
    console.error(`[triggerStep] Failed to trigger ${stepId}:`, err);
  });
}
