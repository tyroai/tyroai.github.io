import { errorCause, loadCauseText } from "@/lib/errorCause"
import { makeId } from "@/features/chat/lib/makeId"

// Neden çözücüsü tembel parçada: ilk pakete girmez. Yavaş ağda hata balonunu geciktirmesin diye
// kısa beklenir; inmezse balonda yalnız kod olur.
const WAIT_MS = 1500

/**
 * Sohbette düşen turun asistan balonu: eski "Yanıt alınamadı" cümlesi + neden cümlesi + kod.
 * Kod kod bloğunda (Markdown'da `_` vurgu sayılmasın). Kod `errorCause`tan: Copilot Studio'nun
 * "request failed with status 403" iletisi, MSAL kodu ya da ağ hatası; kişisel veri girmez.
 */
export async function chatFailureMessage(t, err, agent) {
  const code = errorCause("copilot", err)
  let sentence = null
  try {
    const { causeText } = await loadCauseText(WAIT_MS)
    sentence = causeText(t, code)?.sentence ?? null
  } catch {
    /* çözücü inmedi: cümle yok, kod yine görünür */
  }
  const content = [
    t("chat.error", "Yanıt alınamadı. Aynı soruyu tekrar gönderir misin?"),
    sentence,
    `${t("cause.code")} \`${code}\``,
  ]
    .filter(Boolean)
    .join("\n\n")
  return { id: makeId(), role: "assistant", agent, content, attachments: [], time: new Date() }
}
