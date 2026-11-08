/**
 * Türkiye resmî tatilleri (2026–2028) — yalnız tablo; gün kuralı, yaklaşan tatiller
 * `lib/leaveDays`, köprü `lib/leaveBridges`. Dini bayramların 2027–2028 tarihleri Diyanet'in "Dini Günler"
 * takvimine göre (vakithesaplama.diyanet.gov.tr). ⚠️ Tablo bitince tatil kartı,
 * header etiketi, izin gün hesabı ve dünya saatinin tatil dilimi boşalır: her
 * yıl bir yıl ileriye uzatılır (bkz. docs/features/widgetlar.md).
 * `eve`: yarım günlük arife. Adlar sözlükte (`widgets.holiday.name.<key>`).
 */
import type { DayKey } from "@/lib/leaveDays"

/** Tatilin sözlük anahtarı (`widgets.holiday.name.<key>`). */
export type HolidayKey =
  | "newYear"
  | "ramadan"
  | "sovereignty"
  | "labour"
  | "youth"
  | "sacrifice"
  | "democracy"
  | "victory"
  | "republic"

/** Tablonun bir satırı: `start` ilk gün, `days` gün sayısı, `eve` (varsa) yarım günlük arife. */
export interface Holiday {
  key: HolidayKey
  start: DayKey
  days: number
  eve?: DayKey
}

export const TR_HOLIDAYS: Holiday[] = [
  { key: "newYear", start: "2026-01-01", days: 1 },
  { key: "ramadan", start: "2026-03-20", days: 3, eve: "2026-03-19" },
  { key: "sovereignty", start: "2026-04-23", days: 1 },
  { key: "labour", start: "2026-05-01", days: 1 },
  { key: "youth", start: "2026-05-19", days: 1 },
  { key: "sacrifice", start: "2026-05-27", days: 4, eve: "2026-05-26" },
  { key: "democracy", start: "2026-07-15", days: 1 },
  { key: "victory", start: "2026-08-30", days: 1 },
  { key: "republic", start: "2026-10-29", days: 1, eve: "2026-10-28" },
  { key: "newYear", start: "2027-01-01", days: 1 },
  { key: "ramadan", start: "2027-03-09", days: 3, eve: "2027-03-08" },
  { key: "sovereignty", start: "2027-04-23", days: 1 },
  { key: "labour", start: "2027-05-01", days: 1 },
  { key: "sacrifice", start: "2027-05-16", days: 4, eve: "2027-05-15" },
  { key: "youth", start: "2027-05-19", days: 1 },
  { key: "democracy", start: "2027-07-15", days: 1 },
  { key: "victory", start: "2027-08-30", days: 1 },
  { key: "republic", start: "2027-10-29", days: 1, eve: "2027-10-28" },
  { key: "newYear", start: "2028-01-01", days: 1 },
  { key: "ramadan", start: "2028-02-26", days: 3, eve: "2028-02-25" },
  { key: "sovereignty", start: "2028-04-23", days: 1 },
  { key: "labour", start: "2028-05-01", days: 1 },
  { key: "sacrifice", start: "2028-05-05", days: 4, eve: "2028-05-04" },
  { key: "youth", start: "2028-05-19", days: 1 },
  { key: "democracy", start: "2028-07-15", days: 1 },
  { key: "victory", start: "2028-08-30", days: 1 },
  { key: "republic", start: "2028-10-29", days: 1, eve: "2028-10-28" },
]
