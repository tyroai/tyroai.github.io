/**
 * Tyrofy Disk'in saf hesapları (testli): kartın düzeni, diskin yeri, duran diski dik konuma
 * getiren dönüş, dinleme süresinin yazısı.
 *
 * Disk tek bir kare öğe: kenarı kartın uzun kenarı (`coverSide`), ölçekle küçülür ve merkezi
 * kartın kenarının biraz dışına kayar, yalnız yarısından azı görünür. Yer değişimi transform.
 */

export type DiscLayout = "column" | "row"

/** Belirgin yatay kartta (panonun büyük kartı) disk solda, dar ya da kareye yakın kartta üstte. */
export const discLayoutFor = (width: number, height: number): DiscLayout =>
  height > 0 && width / height > 1.32 ? "row" : "column"

/** Kapak karesinin kenarı (px): kartı her yönde örter. */
export const coverSide = (width: number, height: number) => Math.max(1, width, height)

// Diskin merkezi kartın kenarının bu kadar dışında: yarısından biraz azı görünür.
export const PEEK = 3

export interface DiscPose {
  x: number
  y: number
  scale: number
}

/**
 * Çalarken diskin yeri (kartın ortasına göre px): `column` üst kenarda, çapı kartın eni;
 * `row` sol kenarda, çapı kartın boyu.
 */
export function discPose(width: number, height: number, layout: DiscLayout): DiscPose {
  const side = coverSide(width, height)
  if (layout === "row") return { x: -PEEK - width / 2, y: 0, scale: height / side }
  return { x: 0, y: -PEEK - height / 2, scale: width / side }
}

/** Duran diski dik konuma getiren en kısa dönüş (derece): yarım turdan fazlası öbür yönden. */
export function uprightDelta(angle: number): number {
  if (!Number.isFinite(angle)) return 0
  const a = ((angle % 360) + 360) % 360
  return a > 180 ? 360 - a : -a
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Dinleme süresi: "m:ss", bir saati geçince "s:dd:ss". */
export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor(s / 60) % 60
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}
