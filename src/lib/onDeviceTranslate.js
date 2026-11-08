import { bcp47 } from "@/lib/intl-cache"

/**
 * Cihazda çeviri — tarayıcının yerleşik Translator ve LanguageDetector API'leri (masaüstü Chrome
 * 138+; mobilde yok). Metin cihazdan çıkmaz, anahtar ve ağ isteği yok. API yoksa ya da dil çifti
 * desteklenmiyorsa çağıran sohbete düşer.
 */

/** Hedef dil seçenekleri: arayüz dilleri + ofislerin dilleri (Çin, Romanya, Hollanda, Venezuela). */
export const TRANSLATE_TARGETS = ["tr", "en", "ru", "ar", "zh", "ro", "nl", "es"]

// Bundan düşük güvenle dil "bilinmiyor" sayılır (kısa ya da karışık metin).
const MIN_CONFIDENCE = 0.5
// `availability()` bazı Chromium kurulumlarında hiç dönmüyor (ölçüldü: başsız Chromium 153):
// bu sürede yanıt yoksa cihazda çeviri yok sayılır.
const ANSWER_MS = 2500

// Model inerken bu kadar süre ilerleme gelmezse vazgeçilir (ağ paketi engelliyor olabilir).
const STALL_MS = 10_000

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ])

export function onDeviceTranslateSupported() {
  return "Translator" in globalThis && "LanguageDetector" in globalThis
}

let ready = null

/** Cihazda çeviri kullanılabilir mi — oturumda bir kez sorulur (`Promise<boolean>`). */
export function onDeviceTranslateReady() {
  ready ??= onDeviceTranslateSupported()
    ? withTimeout(globalThis.LanguageDetector.availability(), ANSWER_MS).then(
        (answer) => answer !== "unavailable",
        () => false,
      )
    : Promise.resolve(false)
  return ready
}

/** Hedef: kaynak arayüz dilinden farklıysa arayüz dili; aynıysa İngilizce (arayüz İngilizceyse Türkçe). */
export function pickTarget(source, uiLang) {
  if (source !== uiLang) return uiLang
  return uiLang === "en" ? "tr" : "en"
}

const primary = (tag) =>
  String(tag ?? "")
    .toLowerCase()
    .split("-")[0]

/**
 * Modeli kurar (`api.create`); indirme gerekiyorsa `onProgress(0–1)`. İlerleme `STALL_MS` boyunca
 * durursa reddeder; sonradan gelen model kapatılır.
 */
export function createWatched(api, options, onProgress) {
  return new Promise((resolve, reject) => {
    let settled = false
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        settled = true
        reject(new Error("stalled"))
      }, STALL_MS)
    }
    arm()
    api
      .create({
        ...options,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            if (settled) return
            arm()
            onProgress?.(e.loaded / (e.total || 1))
          })
        },
      })
      .then(
        (instance) => {
          clearTimeout(timer)
          if (settled) return instance.destroy?.()
          settled = true
          resolve(instance)
        },
        (err) => {
          clearTimeout(timer)
          if (settled) return
          settled = true
          reject(err)
        },
      )
  })
}

/** Metnin dili (`"ru"`); güvenle bilinmiyorsa `null`. */
export async function detectLanguage(text, onProgress) {
  const detector = await createWatched(globalThis.LanguageDetector, {}, onProgress)
  try {
    const [top] = await detector.detect(text)
    if (!top || top.detectedLanguage === "und" || top.confidence < MIN_CONFIDENCE) return null
    return primary(top.detectedLanguage)
  } finally {
    detector.destroy?.()
  }
}

/**
 * Çevirir; dil çifti cihazda yoksa `null`. Dil paketi iniyorsa `onProgress(0–1)` (ilk kullanımda
 * tarayıcı paketi indirir; düğmeye basış bunun için gereken kullanıcı etkileşimi).
 */
export async function translateOnDevice(text, { source, target, onProgress }) {
  const pair = { sourceLanguage: source, targetLanguage: target }
  const answer = await withTimeout(globalThis.Translator.availability(pair), ANSWER_MS).catch(
    () => "unavailable",
  )
  if (answer === "unavailable") return null
  const translator = await createWatched(globalThis.Translator, pair, onProgress)
  try {
    return await translator.translate(text)
  } finally {
    translator.destroy?.()
  }
}

const names = new Map()

/** Dilin adı arayüz dilinde ("Rusça"); dil başına bir kez kurulur. */
export function languageName(code, locale) {
  let dn = names.get(locale)
  if (!dn) {
    dn = new Intl.DisplayNames([bcp47(locale)], { type: "language" })
    names.set(locale, dn)
  }
  return dn.of(code) ?? code
}
