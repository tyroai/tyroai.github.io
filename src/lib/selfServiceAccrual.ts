/**
 * Self Servis — sonraki yıllık izin hak edişi (saf, TAHMİN). ERP hak ediş tarihi vermez: tarih,
 * profil başlığındaki işe giriş (kıdem) gününün yıl dönümüdür; gün sayısı o gün dolan kıdem
 * yılının yasal en azıdır (4857 sayılı İş Kanunu md. 53). ERP'nin "hak" alanı
 * (`…yearlyclaimday`) girdi DEĞİL: tüm yılların birikmiş toplamıdır (4 yıllık çalışanda
 * 4 × 14 = 56), tek yıllık pay değil. Ayrıntı: docs/features/self-servis.md › Sonraki hak ediş.
 */

const DAY = 86400000

export interface Accrual {
  /** Bugün ya da sonraki ilk yıl dönümü (ilk hak 1. yılda). */
  date: Date
  /** Dönemin başı: önceki yıl dönümü; ilk yılda işe giriş. */
  from: Date
  /** Takvim günü; 0 = bugün. */
  daysLeft: number
  /** O gün dolan kıdem yılı. */
  years: number
  /** Yeni hakkın gün sayısı: o kıdem yılının yasal en azı. */
  days: number
  estimated: true
}

export interface AccrualProgress {
  from: Date
  to: Date
  total: number
  elapsed: number
  share: number
}

/** Kıdem yılına göre yasal en az yıllık izin (gün): 1–5 yıl 14, 6–14 yıl 20, 15+ yıl 26. */
export function legalMinimum(years: number): number {
  if (years >= 15) return 26
  if (years >= 6) return 20
  if (years >= 1) return 14
  return 0
}

/** `year` yılındaki yıl dönümü (yerel gün); 29 Şubat artık olmayan yılda 28 Şubat. */
function anniversaryIn(hire: Date, year: number): Date {
  const last = new Date(year, hire.getMonth() + 1, 0).getDate()
  return new Date(year, hire.getMonth(), Math.min(hire.getDate(), last))
}

/**
 * Sonraki hak ediş (bugün ya da sonraki ilk yıl dönümü; ilk hak 1. yılda). `days` o gün dolan
 * kıdem yılının yasal en azı. İşe giriş bilinmiyorsa null.
 */
export function nextAccrual(
  hireDate: Date | null | undefined,
  now: Date = new Date(),
): Accrual | null {
  if (!(hireDate instanceof Date) || Number.isNaN(hireDate.getTime())) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let year = Math.max(today.getFullYear(), hireDate.getFullYear() + 1)
  let date = anniversaryIn(hireDate, year)
  if (date < today) date = anniversaryIn(hireDate, ++year)
  const years = year - hireDate.getFullYear()
  return {
    date,
    from: anniversaryIn(hireDate, year - 1),
    // Yaz saati geçişinde gün 23/25 saat: yuvarlama takvim gününü verir.
    daysLeft: Math.round((date.getTime() - today.getTime()) / DAY),
    years,
    days: legalMinimum(years),
    estimated: true,
  }
}

/**
 * Hak ediş döneminin ilerleyişi (`nextAccrual` sonucundan). Geçen gün `daysLeft`ten türer: çubuk
 * ile "66 gün sonra" hep aynı günü söyler. Hak ediş bugünse dolu (share 1); işe giriş henüz
 * gelmediyse boş.
 */
export function accrualProgress(
  accrual: Partial<Pick<Accrual, "from" | "date" | "daysLeft">> | null | undefined,
): AccrualProgress | null {
  if (!(accrual?.from instanceof Date) || !(accrual?.date instanceof Date)) return null
  const total = Math.max(Math.round((accrual.date.getTime() - accrual.from.getTime()) / DAY), 1)
  const elapsed = Math.min(Math.max(total - (accrual.daysLeft ?? 0), 0), total)
  return { from: accrual.from, to: accrual.date, total, elapsed, share: elapsed / total }
}
