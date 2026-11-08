import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { delegatePlan } from "@/features/selfservice/lib/delegateSubmit"

/**
 * Temsilci formunun durumu: kişi, başlangıç, bitiş. Başlangıç seçilince bitiş takvimi kendiliğinden
 * açılır ve bitiş başlangıçtan önceye düşmez. Hatalar yalnız gönderme denenince görünür (`tried`);
 * `build()` planı (`features/selfservice/lib/delegateSubmit.js`) döner ya da ilk hatalı alana odaklanıp `null`.
 * `initial`: `{ start, end, person? }` (izin penceresinde iznin tarihleri; Anlat'tan e-posta adresi
 * gelince kişi). `idBase`: alan kimlikleri.
 */
export function useDelegateForm({ idBase, initial = {} }) {
  const { t } = useLocale()
  const me = useMe()
  const [person, setPerson] = useState(initial.person ?? null)
  const [start, setStartRaw] = useState(initial.start ?? null)
  const [end, setEnd] = useState(initial.end ?? null)
  const [endOpen, setEndOpen] = useState(false)
  const [tried, setTried] = useState(false)

  const plan = delegatePlan({ person, start, end, email: me?.email })
  const shown = tried && !plan.ok ? plan.errors : {}
  const errors = Object.fromEntries(
    Object.entries(shown).map(([k, v]) => [k, t(`selfService.erp.delegate.${v}`)]),
  )
  const setStart = (d) => {
    setStartRaw(d)
    if (end && end < d) setEnd(d)
    setEndOpen(true)
  }
  const build = () => {
    setTried(true)
    if (plan.ok) return plan
    const first = ["person", "start", "end"].find((k) => plan.errors[k])
    const id = { person: `${idBase}-who`, start: `${idBase}-start`, end: `${idBase}-end` }[first]
    requestAnimationFrame(() => document.getElementById(id)?.focus())
    return null
  }
  // Başlık halkası: üç zorunlu alandan kaçı dolu.
  const progress = { done: [person, start, end].filter(Boolean).length, total: 3 }
  return {
    person,
    setPerson,
    start,
    setStart,
    end,
    setEnd,
    endOpen,
    setEndOpen,
    errors,
    build,
    progress,
    dirty: Boolean(person),
  }
}
