import { waitUntil } from '@vercel/functions';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET!;
const BASE_URL = process.env.NEXTAUTH_URL!;

export function triggerStep(stepId: string): void {
  console.log(`[triggerStep] called for stepId=${stepId}, BASE_URL=${BASE_URL}`);
  const promise = fetch(`${BASE_URL}/api/step/${stepId}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
  }).then((res) => {
    console.log(`[triggerStep] fetch response for ${stepId}: status=${res.status}`);
  }).catch((err) => {
    console.error(`[triggerStep] Failed to trigger ${stepId}:`, err);
  });

  // Serverless function response döndükten sonra da promise'ın tamamlanmasını garantile
  console.log(`[triggerStep] registering waitUntil for ${stepId}`);
  waitUntil(promise);
  console.log(`[triggerStep] waitUntil registered, returning`);
}
