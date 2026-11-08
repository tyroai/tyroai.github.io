import { INK } from "../expense/head/headUi"

/**
 * İkon kutusunun renk tonları: alanlar markanın tonunda (palet hangisiyse), izin türleri kendi
 * tonunda (türü bir bakışta ayırt etmek için). Yeşil, sarı ve kırmızı bilinçli olarak yok: onlar
 * durum renkleri (tamam · uyarı · eksik).
 */
export const TONES = {
  brand: `bg-brand/[0.1] ${INK}`,
  sky: "bg-sky-500/[0.12] text-sky-700 dark:bg-sky-400/[0.16] dark:text-sky-300",
  violet: "bg-violet-500/[0.12] text-violet-700 dark:bg-violet-400/[0.16] dark:text-violet-300",
  teal: "bg-teal-500/[0.12] text-teal-700 dark:bg-teal-400/[0.16] dark:text-teal-300",
  blue: "bg-blue-500/[0.12] text-blue-700 dark:bg-blue-400/[0.16] dark:text-blue-300",
  pink: "bg-pink-500/[0.12] text-pink-700 dark:bg-pink-400/[0.16] dark:text-pink-300",
  fuchsia:
    "bg-fuchsia-500/[0.12] text-fuchsia-700 dark:bg-fuchsia-400/[0.16] dark:text-fuchsia-300",
  indigo: "bg-indigo-500/[0.12] text-indigo-700 dark:bg-indigo-400/[0.16] dark:text-indigo-300",
  slate: "bg-slate-500/[0.12] text-slate-700 dark:bg-slate-400/[0.16] dark:text-slate-300",
}
