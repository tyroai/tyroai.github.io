import { dueScene, type BuiltIn, type SceneSignals, type SceneState } from "./scenes"

export interface NextScene {
  scene: BuiltIn
  /** Geçiş anı. */
  at: Date
  /** Geçiş yarın (bugünün takvimi yarına bilinmez: yalnız saat kuralları). */
  tomorrow: boolean
}

const QUIET: SceneSignals = { firstMeeting: null, lastMeetingEnd: null, trip: false }
const DAY_MIN = 24 * 60

/**
 * TYRO'nun bir sonra açacağı sahne ve saati (seçicideki "Sonra ☾ Akşam 17:00"): şu andan ileri
 * dakika dakika `dueScene`e sorulur (toplantı 15:47'de bitiyorsa 15:47); sırası gelen sahne şimdikinden ve açık olandan
 * farklılaştığı ilk an. Yarın 06:00'dan önce bakılmaz; bugünün takvimi yarına kullanılmaz.
 * Kuralların hepsi "Elle" ise ya da 24 saatte değişecek bir şey yoksa `null`.
 */
export function nextScene(state: SceneState, signals: SceneSignals, now: Date): NextScene | null {
  const due = dueScene(state, signals, now)
  const start = new Date(now)
  start.setSeconds(0, 0)
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
  for (let m = 1; m <= DAY_MIN; m++) {
    const at = new Date(start.getTime() + m * 60_000)
    const tomorrow = at.getTime() >= midnight
    // Gece yarısından sabaha kadar akşamın devamı: "yarın 00:00 Akşam" bir geçiş sayılmaz.
    if (tomorrow && at.getHours() < 6) continue
    const next = dueScene(state, tomorrow ? QUIET : signals, at)
    if (next && next !== due && next !== state.scene) return { scene: next, at, tomorrow }
  }
  return null
}
