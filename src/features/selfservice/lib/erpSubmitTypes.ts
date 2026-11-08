/**
 * ERP gönderim akışının (`erpSubmitFlow`) türleri: talep, plan, yan etkiler, sonuç ve pencerenin
 * kapanışı. Yalnız tür: pakete girmez.
 */
/** Talebin türü. */
export type RequestKind = "leave" | "advance" | "expense"

/**
 * `erpPlan`ın planı (`erpPayloads`): `ok: false` ise `errors`; başarılıysa izin ve avansta tek
 * kayıt (`record`), masrafta başlık, kalemler ve onay akışı (`header`, `lines`, `workflow`).
 */
export interface ErpPlan {
  ok?: boolean
  errors?: unknown[]
  record?: unknown
  [key: string]: unknown
}

/** Talep formunun ERP yüküne giren kısmı (`useRequestForm`). */
export interface RequestFormLike {
  values?: unknown
  expense: { rows?: unknown }
  head?: unknown
  defaultTitle?: string
}

/** Yarıda kalan masrafın izi (`erpSubmit` › `submitExpense`): başlık numarası, yazılan kalem, akış. */
export interface ErpPartial {
  number: string | null
  lines: number
  workflow: boolean
}

/** Ekranın hata özeti (`errorOf`). `kind`: "denied" · "rejected" · "network" · "noNumber" · "error". */
export interface ErpErrorSummary {
  kind: string
  message: string
  code: string | null
}

/** Yazımın sonucu: türü ve (avans, masraf) ERP numarası; masrafta eklenemeyen fişler. */
export interface ErpResult {
  kind: RequestKind
  number?: string | null
  failedFiles?: { name: string; reason: string }[]
  partial?: ErpPartial
}

/** `sendErp`in sonucu. */
export type ErpOutcome =
  | { phase: "done"; result: ErpResult }
  | { phase: "fallback" }
  | { phase: "partial"; error: ErpErrorSummary; partial: ErpPartial }
  | { phase: "error"; error: ErpErrorSummary; partial: null }

/** `useErpSubmit`in durumu: sonuçlardan biri ya da yazım öncesi/sırası. */
export type ErpSubmitState =
  ErpOutcome | { phase: "invalid" | "confirm" | "writing"; [key: string]: unknown }

/** Pencerenin kapanışı (`closeStep`). */
export type CloseStep = { type: "stay" } | { type: "done"; result: ErpResult } | { type: "reset" }

/** Gönderilecek talep: plan, (masrafta) fiş dosyaları ve fişleri yükleyenin adı. */
export interface ErpRequest {
  kind: RequestKind
  plan: ErpPlan
  files?: File[]
  uploader?: string
}

/** ERP yazıcısı (`erpWrite` › `createRecord`): tablo, gövde, seçenekler → yazılan kayıt. */
export type ErpCreate = (
  entitySet: string,
  body: unknown,
  options?: { select?: string | null },
) => Promise<{ record?: Record<string, unknown> | null }>

/** Dışarıdan verilen yan etkiler (testte sahte). */
export interface ErpEffects {
  create?: ErpCreate
  toBase64?: (file: File) => Promise<string>
  /** İlerleme: adım adı, sıra, toplam ("Kalem 2 / 3"). */
  onStep?: (step: string, n: number, total: number) => void
  /** TYRO'ya devir; yoksa yetki reddi de "error" olur. */
  fallback?: (() => unknown) | null
  markSent?: () => void
  deleteDraft?: () => void
}

/** Ekranın okuduğu `ErpWriteError` alanları; başka hata da gelebilir, hepsi isteğe bağlı. */
export interface ErpErrorLike {
  kind?: string
  message?: string
  code?: string | null
  partial?: ErpPartial | null
}
