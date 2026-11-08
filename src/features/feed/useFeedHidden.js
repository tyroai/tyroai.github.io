import { FEED_SOURCES } from "@/lib/feedPolicy"
import { useCallback, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { MARK_KINDS, RAIL_SECTIONS, railKey } from "./rail/railModel"

const KEY = "tyro-feed-hidden-v1"
/** Kaydı bu kodun yazdığını gösteren işaret (kimlik değil, sayılmaz). */
const STAMP = "v3"
/** Varsayılan: her şey açık (ürün sahibinin kararı); kullanıcı Özelleştir'den kapatır. */
const DEFAULT_HIDDEN = []
const NONE = new Set(DEFAULT_HIDDEN)

/**
 * Saklı JSON → gizli kimlik kümesi. Kayıt yoksa ya da bozuksa varsayılan (hepsi açık); eski `personal`
 * kimliği iki işarete bölünür. v3'ten eski kayıtta "pinned" kullanıcının seçimi değil eski varsayılandı:
 * silinir, sabitli postalar da açık gelir.
 */
export function parseHidden(raw) {
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return new Set(DEFAULT_HIDDEN)
    // Sürüm damgaları ("v2", "v3") kimlik değil: kümeye girmez.
    const set = new Set(list.filter((x) => typeof x === "string" && !/^v\d+$/.test(x)))
    if (set.delete("personal")) {
      set.add("flagged")
      set.add("high")
    }
    if (!list.includes(STAMP)) set.delete("pinned")
    return set
  } catch {
    return new Set(DEFAULT_HIDDEN)
  }
}

function read() {
  try {
    return parseHidden(localStorage.getItem(KEY))
  } catch {
    return new Set(DEFAULT_HIDDEN)
  }
}

/**
 * Popüler'de GİZLENEN öğeler (Özelleştir menüsü): üç Outlook işareti, kanallar ve sağ rayın
 * bölümleri (`rail.<bölüm>`). Bu tarayıcıda saklanır (yalnız kimlikler, kişisel veri değil).
 * `toggle(id)` aç/kapa, `reset()` hepsini gösterir. Telefonda Özelleştir yok: saklı tercih
 * uygulanmaz (geri açılamayan gizli tür kalmasın), varsayılan geçerli.
 */
export function useFeedHidden() {
  const phone = useIsMobile()
  const [hidden, setHidden] = useState(read)
  const save = useCallback((next) => {
    setHidden(next)
    try {
      localStorage.setItem(KEY, JSON.stringify([...next, STAMP]))
    } catch {
      /* gizli pencere: tercih yalnız bu oturumda */
    }
  }, [])
  const toggle = useCallback(
    (id) => {
      const next = new Set(hidden)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      save(next)
    },
    [hidden, save],
  )
  const reset = useCallback(() => save(new Set()), [save])
  return { hidden: phone ? NONE : hidden, toggle, reset }
}

/**
 * Kaç öğe gizli (yalnız bilinen kimlikler: işaretler, kanallar, ray bölümleri). Dokunulmamış
 * tarayıcıda hepsi açık: rozet ve "Hepsini göster" çıkmaz.
 */
export const hiddenCount = (hidden, { rail = true } = {}) =>
  [
    ...MARK_KINDS,
    ...FEED_SOURCES.map((s) => s.tag),
    ...(rail ? RAIL_SECTIONS.map(railKey) : []),
  ].filter((id) => hidden.has(id)).length
