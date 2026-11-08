import { HOLIDAY_INDEX } from "@/lib/leaveDays"
import { WORK_HOURS } from "@/lib/workHours"

// Hafta sonu Cuma–Cumartesi olan ülkeler (ofislerden Suriye ve Irak; katalogdaki Körfez, Kuzey
// Afrika ve Güney Asya ülkeleri). BAE 2022'den beri Cumartesi–Pazar. Ötekiler Cumartesi–Pazar.
const FRI_SAT = new Set([
  "SY",
  "IQ",
  "SA",
  "KW",
  "QA",
  "BH",
  "OM",
  "JO",
  "EG",
  "YE",
  "LY",
  "DZ",
  "IL",
  "BD",
  "MV",
])

const key = (y, mo, d) => `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`

/** Şehrin duvar saatinde (`{ y, mo, d, h }`) hafta sonu ya da resmî tatil mi (testli). */
export function isOffTime(cc, { y, mo, d, h }) {
  const day = new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
  if (FRI_SAT.has(cc) ? day === 5 || day === 6 : day === 6 || day === 0) return true
  if (cc !== "TR") return false
  // Tatil tablosu çalışma günü takviminin dizininden; arife yarım gün (`eveFrom`'dan sonra kapalı).
  const hit = HOLIDAY_INDEX.days.get(key(y, mo, d))
  return Boolean(hit) && (!hit.eve || h >= WORK_HOURS.eveFrom)
}
