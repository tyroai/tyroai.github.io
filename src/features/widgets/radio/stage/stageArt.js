import { createArtBag, hashIndex } from "./stageModel"

// Sahnenin arka plan koleksiyonu (`public/tyro-stage/`, özgün oranında, uzun kenar 720 px WebP):
// ürün sahibinin illüstrasyonları ve CC0 müzik fotoğrafları; tablo yok (kaynaklar
// `docs/features/widgetlar-radyo.md` › Sahne görselleri). Pakete girmez, ön-önbelleğe de: yalnız
// görünen görsel iner. Her satır [ad, odak x %, odak y %]: kart görseli kaplar ve
// gerektiği kadar keser, kesim odağa göre (ayrıntının yoğun olduğu yer; birkaçı gözle ayarlı).
// Yeni görsel = klasöre dosya + buraya satır.
const ART = [
  // Ürün sahibinin illüstrasyonları
  ["mona-headphones", 50, 50],
  ["red-club", 50, 52],
  ["istanbul-ferry", 50, 50],
  ["disco-crowd", 50, 37],
  ["orange-club", 50, 50],
  ["dj-cat", 50, 53],
  ["cassette-man", 50, 0],
  ["spring-hill", 100, 50],
  ["moon-road", 50, 30],
  ["butterfly", 50, 28],
  ["pastel-cat", 40, 50],
  ["statue-orb", 100, 50],
  ["night-cat", 49, 50],
  ["gold-face", 49, 50],
  ["light-beam", 49, 50],
  ["glow-couple", 50, 58],
  ["starry-couple", 50, 100],
  ["starry-tree", 50, 70],
  ["statue-visor", 100, 50],
  ["rug-cat", 44, 46],
  ["coast-train", 30, 50],
  ["coast-road", 35, 50],
  ["pink-hills", 50, 50],
  ["rocket-glow", 50, 55],
  ["mist-embrace", 45, 40],
  ["galaxy-flower", 40, 50],
  ["sea-ripples", 50, 56],
  ["swirl-tree", 50, 55],
  ["starry-lake", 65, 50],
  ["sunset-boat", 45, 60],
  // CC0 fotoğraflar: akustik
  ["acoustic-sunset", 50, 50],
  ["acoustic-teal", 0, 50],
]

const BASE = `${import.meta.env?.BASE_URL ?? "/"}tyro-stage/`
/** `{ src, pos }` — `pos` görselin CSS `object-position`ı (odak). */
export const STAGE_ART = ART.map(([n, x, y]) => ({ src: `${BASE}${n}.webp`, pos: `${x}% ${y}%` }))

// Bütün sahneler (header penceresi, pano kartları) tek torbadan çeker: hep benzer görseller
// gelmesin, aynı görsel art arda iki kez çıkmasın.
const bag = createArtBag(STAGE_ART)

/** Sıradaki arka plan (`{ src, pos }`); bir sonrakini de önceden indirir (değişince hemen hazır). */
export function nextStageArt() {
  const art = bag.next()
  const upcoming = bag.peek()
  if (upcoming && typeof Image !== "undefined") new Image().src = upcoming.src
  return art
}

/**
 * Logosu olmayan (ya da logosu yüklenemeyen) istasyonun kapağı: koleksiyondan, istasyona göre
 * SABİT — kimliği aynı görselle tanınsın (sahne, liste, header). Resimsiz kanal kalmaz. `{ src, pos }`.
 */
export function stationFallbackArt(station) {
  return STAGE_ART[hashIndex(station?.id ?? station?.name, STAGE_ART.length)]
}
