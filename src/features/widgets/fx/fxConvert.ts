/**
 * Döviz çeviricinin saf hesabı: seçenekler Piyasa'nın verisinden (Truncgil; TL karşılığı), hesap
 * TL üzerinden çapraz kur. Yeni istek yok — kartla aynı önbellek (`useMarketData`).
 */

/** Piyasa verisinin bir satırı (`features/widgets/lib/market` › `parseTruncgil`). */
export interface MarketRowLike {
  id: string
  kind: string
  value: number
  unit?: number
}

/** Çevirici seçeneği: `perUnit` bir biriminin TL karşılığı (TL için 1). */
export interface FxOption {
  id: string
  kind: "try" | "fx" | "gold"
  perUnit: number
}

export const TRY_ID = "try"
/** Gramla çevrilebilen değerli madenler (çeyrek, cumhuriyet gibi adetle satılanlar değil). */
const METALS = new Set(["gram", "silver"])

/** Seçenekler: önce TL, sonra piyasa verisindeki dövizler (katalog sırası), en sonda gram altın ve gümüş. */
export function fxOptions(rows: readonly MarketRowLike[] | null | undefined): FxOption[] {
  const out: FxOption[] = [{ id: TRY_ID, kind: "try", perUnit: 1 }]
  const ok = (r: MarketRowLike) => Number.isFinite(r.value) && r.value > 0
  for (const r of rows ?? [])
    if (r.kind === "fx" && ok(r))
      out.push({ id: r.id, kind: "fx", perUnit: r.value / (r.unit ?? 1) })
  for (const r of rows ?? [])
    if (METALS.has(r.id) && ok(r)) out.push({ id: r.id, kind: "gold", perUnit: r.value })
  return out
}

/** `amount` `from` biriminden `to` birimine; eksik girdi ya da seçenekte `null`. */
export function convert(
  amount: number | null | undefined,
  from: FxOption | null | undefined,
  to: FxOption | null | undefined,
): number | null {
  if (amount == null || !Number.isFinite(amount) || !from || !to) return null
  return (amount * from.perUnit) / to.perUnit
}

/**
 * Sonucun ondalık sayısı: büyük tutarda 2, birden küçükte anlamlı basamak kalsın (0,0199 USD).
 * Yen ve ruble gibi küçük birimler de okunur kalır.
 */
export function fractionDigits(value: number | null): number {
  const v = Math.abs(value ?? 0)
  if (v === 0 || v >= 1) return 2
  if (v >= 0.01) return 4
  return 6
}

/** Kayıtlı çifti doğrular: seçenekte olmayan düşer (TL ↔ ilk döviz), ikisi aynıysa hedef değişir. */
export function sanitizePair(
  pair: { from?: unknown; to?: unknown } | null | undefined,
  options: readonly FxOption[],
): { from: string; to: string } {
  const has = (id: unknown): id is string => options.some((o) => o.id === id)
  const firstFx = options.find((o) => o.kind === "fx")?.id ?? TRY_ID
  const from = has(pair?.from) ? pair.from : firstFx
  let to = has(pair?.to) ? pair.to : TRY_ID
  if (to === from) to = from === TRY_ID ? firstFx : TRY_ID
  return { from, to }
}
