// Ayarlar düzenlemesi (şartname çekirdek rSet + olay işleyicisi): kapasite varsayımları ve
// resmî tatiller. Hepsi taslağı yerinde değiştirir.
import { toDay } from "@/lib/rm/engine/dates"
import { uid } from "./ops"

/** Sayısal varsayımların sınırları (şartname lim): değer bu aralığa kırpılır. */
export const LIMITS = {
  dayHours: [1, 12],
  support: [0, 8],
  dev: [0, 8],
  closingDays: [0, 10],
  horizonMonths: [6, 60],
}
export const SETTING_KEYS = [
  "planStart",
  "dayHours",
  "support",
  "dev",
  "closingDays",
  "horizonMonths",
]

/**
 * Form değerleri → { values, errors }. Sayılar sınırlara kırpılır ve yuvarlanır; boş ya da sayı
 * değilse hata. Danışmanda destek + yazılımcıyla çalışma günlük saatten az olmalı.
 */
export function readSettings(f) {
  const values = {}
  const errors = {}
  if (toDay(f.planStart) == null) errors.planStart = "date"
  else values.planStart = f.planStart
  for (const [k, [lo, hi]] of Object.entries(LIMITS)) {
    const t = String(f[k] ?? "").trim()
    if (t === "" || Number.isNaN(+t)) errors[k] = "number"
    else values[k] = Math.min(hi, Math.max(lo, Math.round(+t)))
  }
  if (!errors.dayHours && !errors.support && !errors.dev) {
    if (values.support + values.dev >= values.dayHours) errors.support = "consSum"
  }
  return { values, errors }
}

export function saveSettings(S, values) {
  S.settings = { ...(S.settings || {}), ...values }
}

/** Yeni tatil satırı (şartname addh): tarih boş başlar; ülke verilmezse TR. */
export function addHoliday(S, h) {
  const row = {
    id: uid(),
    date: h.date || "",
    name: h.name || "",
    type: h.type || "Tatil",
    country: h.country || "TR",
  }
  S.holidays = [...(S.holidays || []), row]
  return row.id
}

export function updateHoliday(S, id, patch) {
  const h = (S.holidays || []).find((x) => x.id === id)
  if (h) Object.assign(h, patch)
}

export function deleteHoliday(S, id) {
  S.holidays = (S.holidays || []).filter((x) => x.id !== id)
}
