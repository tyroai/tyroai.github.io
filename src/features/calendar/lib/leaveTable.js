import { fold } from "@/lib/fold"

/**
 * "İzinler ve talepler" tablosunun satırları (saf, testli): durum grubu, süzgeç, arama, sıra.
 * Kayıtlar Self Servis'ten (`withNames`: `typeName`, `statusName` ekli).
 */

export const FILTERS = ["all", "pending", "approved", "rejected", "cancelled"]

/**
 * Durum grubu: onay bekleyen · onaylanan (tamamlanmış) · iptal · reddedilen. Durumu bilinmeyen
 * kayıt (`none`) hiçbir gruba girmez, yalnız "Hepsi"nde görünür.
 */
export function statusGroup(leave) {
  switch (leave?.statusKind) {
    case "pending":
      return "pending"
    case "completed":
    case "approved":
      return "approved"
    case "cancelled":
      return "cancelled"
    case "rejected":
      return "rejected"
    default:
      return null
  }
}

/**
 * Süzülmüş ve sıralı satırlar: yeniden eskiye (başlangıç günü). `haystack(kayıt)` aranacak metin
 * (tür, durum, açıklama, tarihler — dilin biçimiyle); arama Türkçe harf duyarsız.
 */
export function leaveTableRows(leaves, { filter = "all", query = "", haystack }) {
  const q = fold(query)
  return (leaves ?? [])
    .filter((r) => filter === "all" || statusGroup(r) === filter)
    .filter((r) => !q || fold(haystack(r)).includes(q))
    .sort(
      (a, b) =>
        (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0) ||
        String(a.id).localeCompare(String(b.id)),
    )
}
