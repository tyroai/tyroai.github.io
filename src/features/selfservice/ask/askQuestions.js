/**
 * Ekibim'in "TYRO'ya sor" kutusunun hazır soruları — ekibin bileşimine göre üçer (metin
 * `selfService.askBox.q.<id>`, dört dilde): `team` (yalnız bana bağlılar), `teammates` (yalnız
 * yönetici ve ekip arkadaşları), `mixed` (ikisi). KURAL: yalnız sayfanın CEVAPLAYAMADIĞI soru —
 * kural, nasıl yapılır, işlem; ekipten kimsenin bakiyesi ya da izin türü sorulmaz
 * (docs/features/self-servis-ekibim.md).
 */
export const ASK_QUESTIONS = {
  team: ["approve", "overlap", "delegate"],
  teammates: ["overlap", "approver", "handover"],
  mixed: ["approve", "overlap", "delegate"],
}

/** Sekmenin hazır soruları `[{ id, text }]` (bilinmeyen sekmede boş). */
export function askQuestions(tab, t) {
  const ids = ASK_QUESTIONS[tab]
  if (!ids) return []
  return ids.map((id) => ({ id, text: t(`selfService.askBox.q.${id}`) }))
}
