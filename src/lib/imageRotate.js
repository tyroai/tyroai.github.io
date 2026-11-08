/**
 * Görsel döndürme ve yakınlaştırmanın saf hesapları: ışık kutusu (`ImageLightbox`), fiş küçük
 * resimleri ve gönderimdeki küçültme (`compressImageFile`) aynı açı ve ölçü kurallarını kullanır.
 * Açılar derece, çeyrek tur: 0 · 90 · 180 · 270 (saat yönünde).
 */

/** En yüksek yakınlaştırma: fişin küçük yazısı okunur, piksel yığını olmaz. */
export const MAX_ZOOM = 5
/** Düğme ve tuşla bir adım. */
export const ZOOM_STEP = 1.5
/** Çift tık ve çift dokunuşun yakınlaştırması. */
export const TAP_ZOOM = 2.5

/** Herhangi bir açıyı en yakın çeyrek tura ve 0–270 aralığına getirir (-90 → 270, 450 → 90). */
export function normalizeAngle(deg) {
  const n = Number(deg)
  if (!Number.isFinite(n)) return 0
  const quarter = Math.round(n / 90) * 90
  return ((quarter % 360) + 360) % 360
}

/** Yan yatık mı (90 ya da 270): genişlik ve yükseklik yer değiştirir. */
export const isSideways = (deg) => normalizeAngle(deg) % 180 === 90

/** Döndürülmüş görselin ölçüsü. */
export function rotatedSize(width, height, deg) {
  return isSideways(deg) ? { width: height, height: width } : { width, height }
}

/**
 * İki açı arası en kısa çeyrek tur farkı (-90, 90 ya da 180): 270'ten 0'a geçiş geriye üç çeyrek
 * değil, ileriye bir çeyrek döner.
 */
export function shortestTurn(from, to) {
  const d = normalizeAngle(normalizeAngle(to) - normalizeAngle(from))
  return d === 270 ? -90 : d
}

/**
 * Görseli kutuya sığdırır (büyütmez: küçük görsel kendi pikselinde kalır). Dönüş: döndürülmüş
 * görselin kapladığı kutu (`box`), görsel öğesinin döndürmesiz ölçüsü (`img`, açı 0'daki sığma) ve
 * döndürünce o öğeye uygulanacak ölçek (`k`): yalnız dönüşüm canlanır, düzen sıçramaz.
 */
export function fitRotated(natural, deg, frame) {
  const fit = (w, h) => Math.min(1, frame.width / w, frame.height / h)
  const r = rotatedSize(natural.width, natural.height, deg)
  const f0 = fit(natural.width, natural.height)
  const f = fit(r.width, r.height)
  return {
    box: { width: r.width * f, height: r.height * f },
    img: { width: natural.width * f0, height: natural.height * f0 },
    k: f0 > 0 ? f / f0 : 1,
  }
}

/** Yakınlaştırmayı 1 ile `MAX_ZOOM` arasında tutar. */
export function clampZoom(scale) {
  const s = Number(scale)
  if (!Number.isFinite(s)) return 1
  return Math.min(MAX_ZOOM, Math.max(1, s))
}

/**
 * Bir eksende kaydırmanın sınırı. Görsel çerçevenin ortasında; büyüyünce kenarı çerçevenin
 * kenarından içeri giremez (boşluk açılmaz), çerçeveden küçükken de dışına taşamaz. 1×'te hep 0.
 * `size`: görselin ölçeksiz boyu, `view`: çerçevenin boyu.
 */
export function clampPan(pan, scale, size, view) {
  if (scale <= 1) return 0
  const limit = Math.abs(scale * size - view) / 2
  return Math.min(limit, Math.max(-limit, pan))
}

/**
 * Bir noktayı sabit tutarak ölçek değiştirme: imlecin (ya da iki parmağın ortasının) altındaki yer
 * yakınlaşınca da orada kalır. `d`: noktanın çerçeve ortasına uzaklığı, `pan`: şimdiki kaydırma.
 */
export function anchorPan(d, pan, from, to) {
  return d - (to / from) * (d - pan)
}
