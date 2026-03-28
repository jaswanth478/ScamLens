export const DAILY_LOSS_USD = 27_945_205; // $10.2B / 365 days (FTC 2023)
export const LOSS_PER_SECOND = DAILY_LOSS_USD / 86_400; // ~$323.44/sec

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) ?? [];
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) {
    return '$' + (amount / 1_000_000_000).toFixed(2) + 'B';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLostToday(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secondsSinceMidnight = (now.getTime() - midnight.getTime()) / 1000;
  return secondsSinceMidnight * LOSS_PER_SECOND;
}

export function getRiskScoreColor(score: number): string {
  if (score > 70) return 'text-rose-500';
  if (score > 30) return 'text-amber-500';
  return 'text-emerald-500';
}

export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 10_000);
}

export function isValidClassification(
  value: unknown
): value is 'Scam' | 'Suspicious' | 'Safe' | 'Emergency' {
  return ['Scam', 'Suspicious', 'Safe', 'Emergency'].includes(value as string);
}

export function isValidScore(score: unknown): score is number {
  return typeof score === 'number' && score >= 0 && score <= 100;
}
