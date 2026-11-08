import { useEffect, useRef, useState } from "react"
import { resolveSpoken } from "@/lib/calendar/attendees"

// Rehber bu kadar sürede hazır olmazsa eldeki kaynaklarla (yazıştıkların) devam edilir.
const LATE_MS = 4000

/**
 * Anlat'tan gelen katılımcı adları (`spoken`). Kaynaklar (`settled`: rehber okundu ya da okunamadı)
 * hazır olunca yalnız TEK kişiye uyan adlar çipe dönüşür (`lib/calendar/attendees › resolveSpoken`);
 * kalanlar sırayla arama kutusuna yazılır ve öneri listesi açılır: kişi seçilince ya da kutu
 * boşaltılınca sıradaki ad gelir. Kişinin kutuya yazdığı şeyin üstüne yazılmaz, e-posta adresi uydurulmaz.
 * Her render koşar ve ucuzdur: kuyruk ve kutu durumu değişince ilerler.
 */
export function useSpokenAttendees({
  spoken,
  settled,
  sources,
  value,
  text,
  onChange,
  onText,
  onOpen,
}) {
  const [late, setLate] = useState(false)
  const queue = useRef(null)
  // Kutuya bizim yazdığımız ad; `seen` yazılan değer bir render'da görülünce true (bayat kapanışı ayıklar).
  const mine = useRef({ name: null, seen: false })

  useEffect(() => {
    if (!spoken.length) return undefined
    const id = setTimeout(() => setLate(true), LATE_MS)
    return () => clearTimeout(id)
  }, [spoken])

  const ready = spoken.length > 0 && (settled || late)
  useEffect(() => {
    if (!ready) return
    if (queue.current === null) {
      const { people, rest } = resolveSpoken(spoken, { picked: value, ...sources })
      queue.current = rest
      if (people.length) onChange([...value, ...people])
    }
    const slot = mine.current
    if (slot.name) {
      if (text === slot.name) slot.seen = true
      // Hâlâ bizim yazdığımız ad ya da yazdığımız değer henüz görünmedi: bekle.
      if (text === slot.name || !slot.seen) return
      // Seçildi, silindi ya da üstüne yazıldı: kutu serbest.
      mine.current = { name: null, seen: false }
    }
    if (!text.trim() && queue.current.length) {
      mine.current = { name: queue.current.shift(), seen: false }
      onText(mine.current.name)
      onOpen()
    }
  })
}
