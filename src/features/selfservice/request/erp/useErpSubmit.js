import { useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { erpPreview } from "@/features/selfservice/lib/erpPreview"
import { closeStep, erpPlan, errorOf, sendErp } from "@/features/selfservice/lib/erpSubmitFlow"
import { clearDraft } from "@/lib/requestDrafts"

/**
 * "Gönder"in ERP yolu (izin, masraf) — kararlar `features/selfservice/lib/erpSubmitFlow.ts`te, bu kanca yalnız durumu
 * tutar ve çizer. Onay penceresi YOK, form kendisi gözden geçirmedir (masrafta ayrıca "Gözden
 * geçir" adımı). Durum `state.phase`: "invalid" (ERP'ye gitmeden yakalanan sorun) · "writing" ·
 * "done" (aynı pencerede: akış ✓'lerle kalır, sonuç altına gelir) · "error" (hiçbir şey
 * yazılmadı) · "partial" (masraf yarıda kaldı: numarası var).
 * `alias`: kişinin ERP adresi; `uploader`: fiş notuna yazılan ad; `sent` / `markSent`: formun
 * "gönderildi" işareti (okuma / koyma); `onDone(kind, sonuç)`: form kapanır (`sonuç.show` +
 * `sonuç.preview`: "Kaydı göster", kaydın az önce yazılan hâli). `onDenied`: ERP "yetkin yok" dedi
 * ve hiçbir şey yazılmadı — talep TYRO'ya gider. `create`: yalnız yerel denemede sahte yazıcı.
 */

export function useErpSubmit({
  kind,
  form,
  flow,
  owners,
  alias,
  uploader,
  sent,
  markSent,
  onDone,
  onDenied = null,
  bodyRef,
  create = undefined,
}) {
  const { t, locale } = useLocale()
  const [state, setState] = useState(null)
  const [preparing, setPreparing] = useState(false)
  const running = useRef(false)

  const prepare = async () => {
    if (preparing || state || sent.current) return
    let out = flow?.review ?? null
    if (!out) {
      const job = form.build()
      if (!job) {
        requestAnimationFrame(() =>
          bodyRef.current?.querySelector("[aria-invalid='true']")?.focus(),
        )
        return
      }
      setPreparing(true)
      try {
        out = await job
      } finally {
        setPreparing(false)
      }
    }
    const plan = erpPlan(kind, form, { email: alias, locale })
    if (!plan.ok) {
      setState({ phase: "invalid", problems: plan.errors })
      return
    }
    const files = out?.files ?? []
    const ownerName = owners?.find((o) => o.email === form.head?.owner)?.name ?? null
    const next = {
      plan,
      files,
      ownerName,
      rows: erpPreview(t, locale, kind, plan, { ownerName, files: files.map((f) => f.name) }),
    }
    await write(next)
  }

  const write = async ({ plan, files, ...rest }) => {
    if (running.current) return
    running.current = true
    setState({ phase: "writing", step: null, plan, files, ...rest })
    const onStep = (name, n, total) => setState((s) => ({ ...s, step: { name, n, total } }))
    try {
      const outcome = await sendErp(
        { kind, plan, files, uploader },
        { create, onStep, fallback: onDenied, markSent, deleteDraft: () => clearDraft(kind) },
      )
      // TYRO'ya gitti: akış penceresi TYRO'nun ✓'si ekrana geldikten SONRA kapanır (✓ üstte,
      // perdeli), form bir an çıplak kalmaz. "done"da pencere açık kalır: akış ✓'lerle durur,
      // sonuç altına gelir; kapanış (Kapat, Escape) formu da kapatır (`cancel`).
      if (outcome.phase === "fallback") setState(null)
      else setState((s) => ({ ...s, ...outcome }))
    } catch (e) {
      // TYRO'ya devir de düştüyse pencere "yazılıyor"da asılı kalmasın: hata görünür, taslak
      // durur, kapatıp yeniden denenebilir.
      setState((s) => ({ ...s, phase: "error", error: errorOf(e), partial: null }))
    } finally {
      running.current = false
    }
  }

  const cancel = () => {
    const step = closeStep(kind, state)
    if (step.type === "done") onDone(kind, step.result)
    else if (step.type === "reset") setState(null)
  }

  // Onay aşaması bu yolda yok; `ErpConfirm` aynı sözleşmeyi temsilcinin ERP kipiyle paylaşıyor.
  const confirm = () => state?.phase === "confirm" && write(state)
  // "Kaydı göster": pencere kapanır, kaydın ayrıntısı HEMEN açılır — az önce yazılan hâliyle
  // (`preview`, `erpRecord`); kayıt listeye gelince sayfa ERP'deki hâline geçer.
  const show = (preview = null) =>
    state?.phase === "done" && onDone(kind, { ...state.result, show: true, preview })

  return { prepare, confirm, cancel, show, state, preparing }
}
