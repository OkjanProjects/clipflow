export function formatCount(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatRelativeTime(epochSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - epochSeconds);
  const day = 86_400;
  if (diff < 3_600) return `${Math.max(1, Math.floor(diff / 60))} min`;
  if (diff < day) return `${Math.floor(diff / 3_600)} h`;
  if (diff < day * 30) return `${Math.floor(diff / day)} d`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))} mês`;
  return `${Math.floor(diff / (day * 365))} a`;
}
