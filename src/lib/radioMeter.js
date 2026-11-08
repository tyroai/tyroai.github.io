/**
 * Ses ölçer — header'daki çubuklar müziğe göre oynasın diye çalan yayının bantları (bas · alt
 * orta · üst orta · tiz). Yalnız `captureStream` olan tarayıcıda (Chrome, Edge): çalan öğenin
 * KOPYASI dinlenir, ses Web Audio'ya yönlendirilmez — çalma ve ses düzeyi etkilenmez.
 * ⚠️ `createMediaElementSource` KULLANILMAZ: sesi grafiğe taşıyor; WebKit'te grafiğe ses gelmedi
 * (Safari'de yayın susar), Chromium'da öğenin ses düzeyi/sessizi grafiğe uygulanmadı (ölçüldü).
 * Yalnız CORS'la açılmış yayın okunur (çapraz kaynak verisi başka türlü verilmez; çalar yayınları
 * CORS'lu açar). Okuyan yokken (hap görünmüyor) kurulmaz; duraklayınca bağlam uyur.
 */
// fftSize 64 → 32 bant (~690 Hz): bas · alt orta · üst orta · tiz.
const BANDS = [
  [1, 2],
  [3, 5],
  [6, 10],
  [11, 20],
]

let ctx = null
let analyser = null
let bins = null
let source = null
let media = null
let readers = 0

const supported = () =>
  typeof window !== "undefined" &&
  typeof window.AudioContext === "function" &&
  typeof HTMLMediaElement !== "undefined" &&
  "captureStream" in HTMLMediaElement.prototype

function connect() {
  if (!media || !readers || source || !supported()) return
  try {
    if (!ctx) {
      ctx = new window.AudioContext()
      analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.55
      // Kopya hoparlöre gitmez; grafik ancak hedefe bağlıyken işliyor.
      const sink = ctx.createGain()
      sink.gain.value = 0
      analyser.connect(sink).connect(ctx.destination)
      bins = new Uint8Array(analyser.frequencyBinCount)
    }
    const stream = media.captureStream()
    if (!stream.getAudioTracks().length) {
      stream.addEventListener("addtrack", connect, { once: true })
      return
    }
    source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)
    ctx.resume().catch(() => {})
  } catch {
    source = null
  }
}

function disconnect() {
  try {
    source?.disconnect()
  } catch {
    // zaten kopuk
  }
  source = null
  if (ctx?.state === "running") ctx.suspend().catch(() => {})
}

/** Çalar: CORS'la açılmış öğe çalmaya başladı. */
export function attachMeter(audio) {
  disconnect()
  media = audio
  connect()
}

/** Çalar: öğe bırakıldı (duraklat, kapat, istasyon değişti). */
export function detachMeter() {
  media = null
  disconnect()
}

/** Okuyucu (çubuklar) görünürken abone olur; son okuyucu gidince ölçer kapanır. */
export function subscribeMeter() {
  readers++
  connect()
  return () => {
    readers = Math.max(0, readers - 1)
    if (!readers) disconnect()
  }
}

/** Ham bantlardan 0–1 düzeyler (`out`); hepsi sessizse `false`. Saf: testli. */
export function bandLevels(data, out) {
  let total = 0
  for (let b = 0; b < out.length; b++) {
    const [lo, hi] = BANDS[b] ?? BANDS.at(-1)
    let sum = 0
    for (let i = lo; i <= hi; i++) sum += data[i] ?? 0
    out[b] = sum / (hi - lo + 1) / 255
    total += out[b]
  }
  return total > 0.02
}

/** Çalan yayının bant düzeyleri `out`a; gerçek veri yoksa `false` (çubuklar kendi dansına döner). */
export function readMeter(out) {
  if (!source || ctx?.state !== "running") return false
  analyser.getByteFrequencyData(bins)
  return bandLevels(bins, out)
}
