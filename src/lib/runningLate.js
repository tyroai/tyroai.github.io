/**
 * "Geç kalıyorum" — toplantının düzenleyenine hazır bir e-posta (saf kurallar, testli). Sıradaki
 * toplantı kartı ve geri sayım penceresi kullanır; gönderim ve geri alma `useRunningLate`te.
 * Ayrıntı: docs/features/anasayfa-ozet-toplanti.md › Geç kalıyorum.
 */

/** Seçenekler (dakika). */
export const LATE_MINUTES = [5, 10, 15]
/** Görünme penceresi: başlangıçtan 15 dk önce ile 15 dk sonrası arası. */
export const LATE_WINDOW_MS = 15 * 60_000
/** Kalabalık toplantıda (davetliler bundan çoksa) seçenek hiç çıkmaz. */
export const LATE_MAX_ATTENDEES = 20
/** Gönderim bu kadar bekletilir: Microsoft gönderilmiş postayı geri çekmeye izin vermiyor. */
export const LATE_UNDO_MS = 8_000

/**
 * Bu toplantıda seçenek görünür mü: kişinin kendi takvimi, tüm gün değil, reddetmemiş, düzenleyen
 * başkası ve adresi biliniyor, en çok 20 davetli, şimdi pencerenin içinde ve toplantı bitmemiş.
 * `me`: kişinin adresi (MSAL `username`).
 */
export function canSendLate(event, now, me = "") {
  if (!event?.start || !event?.end || event.owner || event.isAllDay) return false
  if (event.myResponse === "organizer" || event.myResponse === "declined") return false
  const organizer = (event.organizerAddress ?? "").trim().toLowerCase()
  if (!organizer || organizer === me.trim().toLowerCase()) return false
  if ((event.attendees ?? []).length > LATE_MAX_ATTENDEES) return false
  const start = event.start.getTime()
  return now >= start - LATE_WINDOW_MS && now <= start + LATE_WINDOW_MS && now < event.end.getTime()
}

/** Gidecek posta: konu toplantının adıyla, gövde menüde görünen cümlenin AYNISI. */
export function lateMessage(event, minutes, t) {
  return {
    subject: t("calendar.late.subject", { subject: event.subject || t("calendar.noSubject") }),
    body: t("calendar.late.body", { n: minutes }),
  }
}

/** Graph `sendMail` gövdesi: yalnız düzenleyene, düz metin, Gönderilmiş Öğeler'e de. */
export function lateMail(event, { subject, body }) {
  return {
    message: {
      subject,
      body: { contentType: "Text", content: body },
      toRecipients: [
        {
          emailAddress: {
            address: event.organizerAddress,
            name: event.organizer || undefined,
          },
        },
      ],
    },
    saveToSentItems: true,
  }
}
