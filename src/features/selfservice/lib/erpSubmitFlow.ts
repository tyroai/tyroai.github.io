import {
  advancePayload,
  expensePayloads,
  leavePayload,
} from "@/features/selfservice/lib/erpPayloads"
import {
  fileToBase64,
  submitAdvance as advanceJs,
  submitExpense as expenseJs,
  submitLeave as leaveJs,
} from "@/features/selfservice/lib/erpSubmit"
import { titleOf } from "@/lib/expenseHead"
import type {
  CloseStep,
  ErpCreate,
  ErpEffects,
  ErpErrorLike,
  ErpErrorSummary,
  ErpOutcome,
  ErpPartial,
  ErpPlan,
  ErpRequest,
  ErpResult,
  ErpSubmitState,
  RequestFormLike,
  RequestKind,
} from "@/features/selfservice/lib/erpSubmitTypes"

export type * from "@/features/selfservice/lib/erpSubmitTypes"

/**
 * TALEBİN ERP'YE GÖNDERİM KARARI — React dışında, saf akış; yan etkiler dışarıdan verilir
 * (testte sahte): ERP yazıcısı (`create`), TYRO'ya devir (`fallback`), "gönderildi" işareti
 * (`markSent`) ve taslak silme (`deleteDraft`). Kurallar:
 *
 * - Yazıldı → gönderildi sayılır, taslak silinir (yeniden kaydedilmesin, ikinci kayıt açılmasın).
 * - ERP "yetkin yok" dedi ve HİÇBİR ŞEY yazılmadı → talep sessizce TYRO'ya gider.
 * - Masraf yarıda kaldı (numarası var ya da başlık numarasız açıldı) → kayıt ERP'de var:
 *   gönderildi sayılır, taslak silinir; taslaktan yeniden göndermek ikinci kayıt açardı.
 * - Öteki her hata → hiçbir şey yazılmadı, taslak kalır.
 *
 * `useErpSubmit` yalnız bu sonucu çizer.
 */

// `erpSubmit.js` henüz JS: çıkarılan türleri gevşek (`kind: string`, `onStep: () => void`).
// Yazıcılar burada belgelenen biçimleriyle okunur.
type WriteOptions = Pick<ErpEffects, "create" | "onStep"> & { uploader?: string }
type Packed = { name: string; type: string; base64: string }
const submitLeave = leaveJs as (record: unknown, options: WriteOptions) => Promise<ErpResult>
const submitAdvance = advanceJs as (record: unknown, options: WriteOptions) => Promise<ErpResult>
const submitExpense = expenseJs as (
  plan: ErpPlan,
  files: Packed[],
  options: WriteOptions,
) => Promise<ErpResult>

const noop = () => {}

/** Formdan ERP kaydının planı (`ok: false` ise `errors`: ERP'ye gitmeden yakalanan sorunlar). */
export function erpPlan(
  kind: RequestKind,
  form: RequestFormLike,
  { email, locale }: { email: string; locale: string },
): ErpPlan {
  if (kind === "leave") return leavePayload({ values: form.values, email })
  if (kind === "advance") return advancePayload({ values: form.values, email, locale })
  return expensePayloads({
    rows: form.expense.rows,
    head: form.head,
    title: titleOf(form.head, form.defaultTitle),
    email,
    locale,
  })
}

/** Yarıda kalan masrafın izi; kayıt ERP'de yoksa `null`. */
export function partialOf(error: unknown): ErpPartial | null {
  const e = error as ErpErrorLike | null | undefined
  return e?.partial && (e.partial.number || e.kind === "noNumber") ? e.partial : null
}

/** Ekranın hata özeti — iletinin kendisi ERP'nin; yoksa genel tür. */
export const errorOf = (error: unknown): ErpErrorSummary => {
  const e = error as ErpErrorLike | null | undefined
  return { kind: e?.kind ?? "error", message: e?.message ?? "", code: e?.code ?? null }
}

// Türüne göre yazım sırası (`erpSubmit`); masrafta fişler önce base64'e çevrilir.
async function writeErp(
  kind: RequestKind,
  plan: ErpPlan,
  files: File[],
  {
    create,
    toBase64,
    onStep,
    uploader,
  }: Required<Pick<ErpEffects, "toBase64" | "onStep">> & { create?: ErpCreate; uploader: string },
): Promise<ErpResult> {
  const writer = create ? { create } : {}
  if (kind === "leave") return submitLeave(plan.record, { onStep, ...writer })
  if (kind === "advance") return submitAdvance(plan.record, { onStep, ...writer })
  const packed = await Promise.all(
    files.map(async (f) => ({ name: f.name, type: f.type, base64: await toBase64(f) })),
  )
  return submitExpense(plan, packed, { onStep, uploader, ...writer })
}

/**
 * Gönderimi yürütür. Dönüş: `{ phase: "done", result }` · `{ phase: "fallback" }` (TYRO'ya
 * gitti) · `{ phase: "partial" | "error", error, partial }`. `fallback` yoksa yetki reddi de
 * "error" olur. TYRO'ya devir ya da yarıda kalmadaki taslak silme fırlatırsa hata yukarı çıkar.
 */
export async function sendErp(
  { kind, plan, files = [], uploader = "" }: ErpRequest,
  {
    create = undefined,
    toBase64 = fileToBase64,
    onStep = noop,
    fallback = null,
    markSent = noop,
    deleteDraft = noop,
  }: ErpEffects = {},
): Promise<ErpOutcome> {
  try {
    const result = await writeErp(kind, plan, files, { create, toBase64, onStep, uploader })
    markSent()
    deleteDraft()
    return { phase: "done", result }
  } catch (e) {
    const partial = partialOf(e)
    if (!partial && (e as ErpErrorLike | null | undefined)?.kind === "denied" && fallback) {
      await fallback()
      return { phase: "fallback" }
    }
    if (partial) {
      markSent()
      deleteDraft()
    }
    const error = errorOf(e)
    return partial ? { phase: "partial", error, partial } : { phase: "error", error, partial }
  }
}

/**
 * Pencerenin kapanışı: yazım sürerken yok (`stay`); kayıt oluştuysa — yarıda kalsa da — form
 * da kapanır (`done` + sonuç), formda kalıp yeniden göndermek ikinci kayıt açardı; öteki
 * durumda pencere kapanır, form kalır (`reset`).
 */
export function closeStep(kind: RequestKind, state: ErpSubmitState | null | undefined): CloseStep {
  if (state?.phase === "writing") return { type: "stay" }
  if (state?.phase === "done") return { type: "done", result: state.result }
  if (state?.phase === "partial") {
    return {
      type: "done",
      result: { kind, number: state.partial.number, partial: state.partial },
    }
  }
  return { type: "reset" }
}
