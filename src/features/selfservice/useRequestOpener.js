import { useCallback, useRef, useState } from "react"
import { loadDraft } from "@/lib/requestDrafts"

/**
 * Talep penceresi ve Temsilci ata penceresi: hangisi açık, neyle açıldı (formun alanları
 * `request/useRequestForm`da). Self Servis (`useRequestDialogs`) ve Takvim aynı açışı kullanır.
 * - `onNew(kind, from?, preset?)`: yarım kalan taslak varsa form onunla açılır (başında
 *   "Taslağından devam ediyorsun"); `preset` (`{ values, rows?, head?, text? }`) varsa onunla —
 *   Anlat'tan gelince başında yazılan cümle (`text`). `from`: form kapanınca odağın döneceği öğe.
 *   "delegate" (Yeni'nin dördüncüsü) kendi penceresinde; Anlat'tan gelince `initial` = `values`
 *   (`person` arama metni, `start`, `end`).
 * Her açılış taze form (`seq` anahtarı): sayaç, saat değil — aynı milisaniyede iki açılış da ayrı.
 */
export function useRequestOpener() {
  const [form, setForm] = useState(null)
  const [delegate, setDelegate] = useState(null)
  const seqRef = useRef(0)

  const onNew = useCallback((kind, from = null, preset = null) => {
    const seq = ++seqRef.current
    if (kind === "delegate") {
      setDelegate({ seq, from, initial: preset?.values ?? null })
      return
    }
    if (preset) {
      setForm({
        kind,
        seq,
        from,
        initial: { values: preset.values, rows: preset.rows, head: preset.head },
        origin: preset.text ? { type: "narrate", text: preset.text } : null,
      })
      return
    }
    const draft = loadDraft(kind)
    setForm({
      kind,
      seq,
      from,
      initial: draft?.initial ?? null,
      origin: draft ? { type: "draft", at: draft.at, missing: draft.missing } : null,
    })
  }, [])

  return { form, setForm, delegate, setDelegate, onNew, seqRef }
}
