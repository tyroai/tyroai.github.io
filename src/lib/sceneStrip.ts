/**
 * SAHNE ŞERİDİ BİÇİMİ — Anasayfa'daki sahne seçicisinin görünüşü (Profil › Görünüm). Üç biçim:
 * "picker" tek düğme + menü (varsayılan), "tabs" alt çizgili sekmeler, "icons" yalnız simgeler
 * (seçilenin adı görünür). Seçim bu tarayıcıda saklanır (`tyro-scene-strip-v1`, kişisel veri
 * değil); varsayılan depoya yazılmaz, tanınmayan kayıt varsayılana düşer.
 */
const KEY = "tyro-scene-strip-v1"
const EVENT = "tyro:scene-strip"

export const SCENE_STRIPS = ["picker", "tabs", "icons"] as const
export type SceneStrip = (typeof SCENE_STRIPS)[number]
export const DEFAULT_SCENE_STRIP: SceneStrip = "picker"

export function readSceneStrip(): SceneStrip {
  if (typeof window === "undefined") return DEFAULT_SCENE_STRIP
  try {
    const value = window.localStorage.getItem(KEY)
    return (SCENE_STRIPS as readonly string[]).includes(value ?? "")
      ? (value as SceneStrip)
      : DEFAULT_SCENE_STRIP
  } catch {
    return DEFAULT_SCENE_STRIP
  }
}

export function writeSceneStrip(id: SceneStrip): void {
  if (typeof window === "undefined" || !SCENE_STRIPS.includes(id)) return
  try {
    if (id === DEFAULT_SCENE_STRIP) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, id)
  } catch {
    // Depo kapalı: seçim yenilemede varsayılana döner.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeSceneStrip(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
