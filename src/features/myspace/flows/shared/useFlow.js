import { useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import {
  PROMPT_TEMPLATES,
  applySlot,
  composeTemplate,
  isSlotEmpty,
  missingSlot,
  optionLabel,
  presetValues,
} from "@/lib/promptTemplates"
import { cap, startOfToday } from "./flowText"

/**
 * Akışların ortak durumu (iş avansı · izin · masraf): şablonun değerleri (`lib/promptTemplates`),
 * açık seçim kartı ve yeri, gönderme. Alanlar ve gönderilen cümle şablonla birebir
 * (`composeTemplate`): asistan için alanlı cümleden farkı yok. Eksik zorunlu alanla gönderilmez,
 * o alanın kartı açılır. `tall`: `{ alan: boy }` — kartı uzun olan alan sözcüğün üstüne
 * sığmıyorsa panelin tepesinden açılır. `onClose`: kart kapanınca (önizlemeyi sıfırlamak için).
 */
export function useFlow(key, { tall = {}, onClose } = {}) {
  const { t, locale } = useLocale()
  const body = useRef(null)
  const slots = PROMPT_TEMPLATES[key].slots
  const [values, setValues] = useState(() => presetValues(key))
  const [card, setCard] = useState(null) // { name, place }
  const [today] = useState(startOfToday)

  const set = (name, value) => setValues((v) => applySlot(key, v, name, value).values)
  const close = () => {
    const name = card?.name
    setCard(null)
    onClose?.()
    if (name) body.current?.querySelector(`[data-slot="${name}"]`)?.focus({ preventScroll: true })
  }
  /** Kart tıklanan sözcüğün üstünde açılır; üstte yer yoksa altında, uzunsa panelin tepesinden. */
  const openCard = (name, el) => {
    const host = body.current
    const trigger = el ?? host?.querySelector(`[data-slot="${name}"]`)
    if (!host || !trigger) return
    const box = host.getBoundingClientRect()
    const at = trigger.getBoundingClientRect()
    const x = Math.round(((at.left + at.width / 2 - box.left) / box.width) * 100)
    const room = at.top - box.top
    setCard({
      name,
      place:
        tall[name] && room < tall[name]
          ? { top: 8, origin: `${x}% 100%` }
          : room > 200
            ? { bottom: box.bottom - at.top + 10, origin: `${x}% 100%` }
            : { top: at.bottom - box.top + 10, origin: `${x}% 0%` },
    })
  }
  /** Seçer ve kartı kapatır; şablon sıradaki alanı işaret ediyorsa (başlangıç → bitiş) onu açar. */
  const pick = (name, value) => {
    const next = applySlot(key, values, name, value)
    setValues(next.values)
    if (next.open) openCard(next.open)
    else close()
  }
  /** Seçeneğin metni (boşsa `null`). */
  const text = (name) =>
    isSlotEmpty(slots[name], values[name]) ? null : optionLabel(t, slots[name], values[name])
  const lead = (name) => t(`myspace.slot.${name}`)
  const choices = (name) =>
    slots[name].options.map((o) => ({
      value: o,
      label: cap(optionLabel(t, slots[name], o), locale),
    }))
  /** Gönderir; eksik zorunlu alan varsa onun kartını açar. `true`: gönderildi. */
  const send = (onSend) => {
    const miss = missingSlot(t, key, values)
    if (miss) {
      openCard(miss.name)
      return false
    }
    onSend(composeTemplate(t, locale, key, values))
    setValues(presetValues(key))
    return true
  }
  // Kart açıkken Escape pencereyi değil kartı kapatır.
  const onEscape = (e) => {
    if (!card) return
    e.preventDefault()
    close()
  }
  // İki parça: çizimde okunanlar (`view`) ve olaylarda çağrılanlar (`act` — gövdeye `ref`le dokunur;
  // çizim sırasında çağrılmaz).
  const view = { t, locale, slots, values, today, card, text, lead, choices }
  const act = { set, pick, openCard, close, send, onEscape }
  return [view, act, body]
}
