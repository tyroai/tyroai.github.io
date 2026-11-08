import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"

/**
 * Postayı yanıt taslağı için asistana verir (kart ve büyük okuyucu aynı eylemi çizer).
 * `t(key, vars)`, `.replace()` zinciri değil: konu serbest metin ve String.replace yerine
 * koyma dizgesindeki `$` kalıplarını açar ("Bütçe $$4M" bozulurdu).
 */
export function draftReplyWithAssistant(m, t) {
  setPendingAsk({
    question: t("mail.assistPrompt", {
      from: m.from || t("mail.unknownSender"),
      subject: m.subject || t("mail.noSubject"),
      preview: m.preview || "—",
    }),
    // Posta işi ofis asistanının; katalogda yoksa ChatScreen geçerli asistana düşer.
    agent: "tyroOffice",
  })
  requestOpenChat({ focusComposer: true })
}
