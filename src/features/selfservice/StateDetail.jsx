import { ErrorCause } from "@/components/common/ErrorCause"

/**
 * Self Servis'in bağlanamama ya da bölüm uyarısının altı: uygulamanın ortak neden satırı (sade
 * cümle, "Teknik ayrıntı", Kopyala — `common/ErrorCause`). Kod kişisel veri içermez.
 * `tone="warn"`: sarı bölüm uyarısının içinde.
 */
export function StateDetail({ detail, tone }) {
  return <ErrorCause detail={detail} tone={tone} />
}
