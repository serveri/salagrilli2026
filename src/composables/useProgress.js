// Reactive solved-state for the challenges, persisted in localStorage so a solved
// task stays green across reloads. This is intentionally the only place we track
// progress — there is no per-user record on the server.
//
// On each solve we fire a lean, anonymous Plausible custom event so the organisers
// can see how many people cleared each task (counts only, no user data).

import { reactive, computed } from 'vue'

const STORAGE_KEY = 'salagrilli:progress:v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

// { [id]: { reward: string, at: number } }
const solved = reactive(load())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solved))
  } catch {
    // Private mode / storage full — progress just won't persist. Non-fatal.
  }
}

function track(event, props) {
  try {
    window.plausible?.(event, props ? { props } : undefined)
  } catch {
    // Analytics must never break the solve flow.
  }
}

export function useProgress() {
  const isSolved = (id) => Boolean(solved[String(id)])
  const rewardFor = (id) => solved[String(id)]?.reward ?? null

  function markSolved(id, reward) {
    const key = String(id)
    if (solved[key]) return // already recorded — don't double-count analytics
    solved[key] = { reward, at: Date.now() }
    persist()
    track('Flag Solved', { task: key })
  }

  const solvedCount = computed(() => Object.keys(solved).length)

  return { solved, isSolved, rewardFor, markSolved, solvedCount }
}
