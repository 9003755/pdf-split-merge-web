const KEY = 'guest_usage_count'

export function getGuestUsageCount(): number {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseInt(raw) || 0 : 0
  } catch {
    return 0
  }
}

export function incrementGuestUsage(): number {
  const current = getGuestUsageCount() + 1
  try {
    localStorage.setItem(KEY, String(current))
  } catch {}
  return current
}

export function canGuestUse(maxTimes = 3): { allowed: boolean; remaining: number } {
  const used = getGuestUsageCount()
  const remaining = Math.max(0, maxTimes - used)
  return { allowed: used < maxTimes, remaining }
}
