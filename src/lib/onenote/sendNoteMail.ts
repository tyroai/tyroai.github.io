import { graphPostNoContent } from "@/lib/graph"
import type { MsalAccount, MsalInstance } from "@/lib/graphRequest"
import { STATUS } from "@/lib/graphRequest"
import { MAIL_SEND_SCOPES, toRecipients } from "@/lib/mailSend"
import type { NoteMail } from "./onenoteMail"

/** Graph'ın tek istek sınırı ~4 MB: gövde + gömülü görseller (base64) bunun altında kalmalı. */
export const MAX_REQUEST_CHARS = 3.75 * 1024 * 1024

interface Person {
  name?: string
  address?: string
}

export type SendNoteResult =
  | { ok: true }
  | {
      ok: false
      reason: "no-recipient" | "too-large" | "denied" | "send"
      detail?: string
      cause?: string
    }

/**
 * Notu kullanıcının KENDİ kutusundan HTML posta olarak gönderir (`/me/sendMail`, `Mail.Send`;
 * Gönderilmiş Öğeler'de durur). `mail`: `noteMail` çıktısı. İzin onayı çağıranda
 * (`sendWithConsent`).
 */
export async function sendNoteMail(
  instance: MsalInstance,
  account: MsalAccount,
  { to, cc = [], subject, mail }: { to: Person[]; cc?: Person[]; subject: string; mail: NoteMail },
): Promise<SendNoteResult> {
  const toList = toRecipients(to)
  if (!toList.length) return { ok: false, reason: "no-recipient" }
  const size = mail.html.length + mail.attachments.reduce((n, a) => n + a.contentBytes.length, 0)
  if (size > MAX_REQUEST_CHARS) return { ok: false, reason: "too-large" }
  const res = await graphPostNoContent(instance, account, {
    path: "/me/sendMail",
    scopes: MAIL_SEND_SCOPES,
    body: {
      message: {
        subject,
        body: { contentType: "HTML", content: mail.html },
        toRecipients: toList,
        ccRecipients: toRecipients(cc),
        attachments: mail.attachments,
      },
      saveToSentItems: true,
    },
  })
  if (res.status === STATUS.ready) return { ok: true }
  const detail = "error" in res ? res.error : "httpStatus" in res ? String(res.httpStatus) : ""
  return {
    ok: false,
    reason: res.status === STATUS.denied ? "denied" : "send",
    detail,
    cause: "detail" in res ? res.detail : undefined,
  }
}
