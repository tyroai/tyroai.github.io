import { getNumberFormat, pluralKey } from "@/lib/intl-cache"

/** Çoğul biçimli sayı metni ("1 kişi" · "5 kişi"; Rusça/Arapça kurallarıyla) — `base.one` … `base.other`. */
export const countLabel = (t, locale, base, n) =>
  t(pluralKey(base, locale, n), { n: getNumberFormat(locale).format(n) })
