/**
 * Kaydın onay adımları — durum KATEGORİSİNDEN türetilir (ERP adım saati vermez): Taslak →
 * Onayda → Onaylandı → Tamamlandı (avansta Ödendi). İade, ret ve iptal "Onayda" adımında durur;
 * adın yerine durumun adı, tonu durumunkiyle. Kategori bilinmiyorsa (`other`, `none`) adım yok.
 *
 * @returns {null | { id: string, label: string, state: "done"|"current"|"stopped"|"upcoming" }[]}
 */
const FLOW = ["draft", "pending", "approved", "completed"]
const STOP = new Set(["returned", "rejected", "cancelled"])

export function statusSteps(recordKind, category) {
  if (recordKind === "leave") return null
  const stopped = STOP.has(category)
  const at = stopped ? 1 : FLOW.indexOf(category)
  if (at < 0) return null
  return FLOW.map((id, i) => {
    const label =
      i === at && stopped
        ? `selfService.status.${category}`
        : id === "draft"
          ? "selfService.steps.draft"
          : id === "completed" && recordKind === "advance"
            ? "selfService.steps.paid"
            : `selfService.status.${id}`
    // Son adıma varmış kayıt da "şu an"da: tamamlanmış süreç tikle, vurgulu gösterilir.
    const state = i < at ? "done" : i === at ? (stopped ? "stopped" : "current") : "upcoming"
    return { id, label, state }
  })
}

const DAY = 864e5

/** İznin zamandaki yeri: `upcoming` (başlamadı) · `ongoing` (bugün içinde) · `past` (bitti). */
export function leavePhase(record, now = new Date()) {
  if (record?.kind !== "leave" || !record.start) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const start = record.start.getTime()
  const end = (record.end ?? record.start).getTime()
  if (start > today) return "upcoming"
  if (end + DAY <= today) return "past"
  return "ongoing"
}
