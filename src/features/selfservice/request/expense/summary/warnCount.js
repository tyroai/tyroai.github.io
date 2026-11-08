// ERP'de eşi olabilecek bu kadar kaleme kadar her biri ayrı satır; fazlası tek satır + numaralar.
export const SEEN_ONE_BY_ONE = 2
// Formda aynı görünen kalemlerden en çok bu kadar çift ayrı satır.
export const TWIN_LINES = 2

/**
 * Özetin "n uyarı" sayısı: görünen uyarı satırları kadar — ileri tarih (tek satır), ERP'de eşi
 * olabilecekler (tek tek ya da toplu tek satır), aynı görünen çiftler.
 */
export function warningCount(info) {
  const seen = info.submitted?.length ?? 0
  return (
    (info.future.length ? 1 : 0) +
    (seen > SEEN_ONE_BY_ONE ? 1 : seen) +
    Math.min(info.duplicates.length, TWIN_LINES)
  )
}

/**
 * Dikkat isteyen şeylerin sayısı: eksik alanlar (gönderimi engeller) ve uyarılar (engellemez).
 * Telefonun alt şeridindeki ayrıntı düğmesi sıfırsa ⓘ, değilse sarı uyarı simgesi ve bu sayıyı
 * gösterir (`ExpenseDetails`).
 */
export const attentionCount = (info) => info.missing.length + warningCount(info)
