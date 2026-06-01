const STORAGE_KEY = "wc2026-chips"
const STREAK_KEY = "wc2026-streak"

export function getChips(): number {
  if (typeof window === "undefined") return 0
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

export function addChips(amount: number): number {
  const current = getChips()
  const newTotal = Math.max(0, current + amount)
  try {
    localStorage.setItem(STORAGE_KEY, String(newTotal))
  } catch {
    /* noop */
  }
  return newTotal
}

export function getStreak(): number {
  if (typeof window === "undefined") return 0
  try {
    const stored = localStorage.getItem(STREAK_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

export function setStreak(streak: number): void {
  try {
    localStorage.setItem(STREAK_KEY, String(streak))
  } catch {
    /* noop */
  }
}

export function resetChips(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STREAK_KEY)
  } catch {
    /* noop */
  }
}
