import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { clearDraft, encodeForm } from "@/lib/requestDrafts"
import { stashSent } from "@/lib/requestEdits"
import { requestCard } from "./requestCard"

// Gönderim onayının (✓) ekranda kaldığı süre; sonra form kapanır, sohbet açılır.
const DONE_MS = 1000
const DONE_MS_CALM = 350

const newFormId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

/**
 * Talebin gönderimi: doğrulama, (masrafta) gözden geçirme, telefonda adımlar ve gönderim anı.
 * Gönderilince taslak silinir, sohbetteki kart formun kendisini taşır (`card.form`, "Formda
 * düzenle"; fişler bellekte `stashSent`) ve ✓ onayı (`done`) kısa bir an görünür; sonra `onSubmit`.
 * O arada form kapanmaz (`done` iken kapatma yok sayılır); bileşen yine de kalkarsa gönderim
 * yarıda kalmaz. `steps`: telefonda izin ve avansın iki adımı (ilk adımda "Devam"). `me`: kartta
 * "Kendim" yerine yazılan ad (`{ name }`, `useExpenseOwners`). `sent` yalnız okunur; koymak
 * `markSent()` ile.
 */
export function useRequestSubmit({
  kind,
  form,
  flow,
  owners,
  me = null,
  balance,
  onSubmit,
  bodyRef,
  steps,
}) {
  const { t, locale } = useLocale()
  const calm = useReducedMotion()
  const sent = useRef(false)
  const closed = useRef(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const pending = useRef(null)

  // Bileşen ✓ sürerken kalkarsa (sayfa değişti) bekleyen gönderim hemen yapılır.
  useEffect(
    () => () => {
      const job = pending.current
      if (!job) return
      clearTimeout(job.timer)
      job.run()
    },
    [],
  )

  const focusError = () =>
    requestAnimationFrame(() => bodyRef.current?.querySelector("[aria-invalid='true']")?.focus())

  // "Gönderildi": taslak yeniden yazılmaz, form ikinci kez göndermez (ERP yolu da koyar).
  const markSent = () => {
    sent.current = true
  }

  const send = (out) => {
    markSent()
    clearDraft(kind)
    const formId = newFormId()
    stashSent(formId, kind === "expense" ? form.expense.receipts : [])
    const card = {
      ...requestCard(kind, { t, locale, form, owners, me, balance }),
      form: encodeForm(form.snapshot()),
      formId,
    }
    setDone(true)
    const run = () => {
      pending.current = null
      onSubmit(kind, { ...out, card })
    }
    pending.current = { run, timer: setTimeout(run, calm ? DONE_MS_CALM : DONE_MS) }
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (busy || sent.current) return
    // Telefonda ilk adım: eksik yoksa özete geçilir (gönderilmez).
    if (steps?.first) {
      if (form.build()) steps.next()
      else focusError()
      return
    }
    if (flow.review) return send(flow.review)
    const job = form.build()
    if (!job) {
      // Hatalar bir sonraki çizimde görünür; odak ilk hatalı alana.
      focusError()
      return
    }
    // Fişler gönderimden önce küçültülüyor (birkaç saniye sürebilir): çift gönderim olmasın.
    setBusy(true)
    try {
      const out = await job
      if (closed.current) return
      if (!flow.reviewing) return send(out)
      flow.setReview(out)
      bodyRef.current?.closest(".overflow-y-auto")?.scrollTo(0, 0)
    } finally {
      setBusy(false)
    }
  }

  // Form kapatıldı: küçültme bitince gönderilmez.
  const markClosed = () => {
    closed.current = true
  }

  return { submit, sent, markSent, markClosed, busy, done }
}
