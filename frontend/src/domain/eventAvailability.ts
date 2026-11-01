export function eventLocked(event: { featured: boolean; startAt?: string }, now: number): boolean {
  if (event.featured) return false;
  const startTime = event.startAt ? Date.parse(event.startAt) : NaN;
  return !Number.isFinite(startTime) || now < startTime;
}
