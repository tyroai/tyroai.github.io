import { useState } from "react"
import { bumpRequestCount } from "@/hooks/useAuthorizations"
import { useLocale } from "@/hooks/useLocale"
import { DV_DUPLICATE_UPN } from "@/lib/authorizations"
import { DV_FORBIDDEN, DV_SESSION_EXPIRED } from "@/lib/dataverse"
import { causeNote } from "@/lib/causeText"
import { notify } from "@/lib/notify"

/** Yazma hatasının cümlesi: kod ne yapılacağını seçer (oturum · yetki · zaten var · tekrar dene). */
export function writeErrorKey(err) {
  if (err?.code === DV_SESSION_EXPIRED) return "authz.error.session"
  if (err?.code === DV_FORBIDDEN) return "authz.error.forbidden"
  if (err?.code === DV_DUPLICATE_UPN) return "authz.error.duplicate"
  // Liste hatasının cümlesi ("son bilinen hâl") yazmaya uymaz: kendi cümlesi var.
  return "authz.inbox.writeFailed"
}

/**
 * Talepler ve Uygulamalar sekmelerinin yazma koşucusu: meşgul anahtarı, sonuç bildirimi
 * (başarıda kısa onay, isteğe bağlı "Geri al"; hatada sebep) ve ortak listenin tazelenmesi.
 * Tazeleme başarıda DA hatada DA yapılır: yarım kalan yazma (yetki yazıldı, talep kapanmadı)
 * ekranda görünsün. Kenar çubuğundaki bekleyen rozeti de haber alır (`bumpRequestCount`).
 */
export function useAuthzAction(ctx) {
  const { t } = useLocale()
  const [busy, setBusy] = useState(null)

  async function run(key, fn, { done, undo } = {}) {
    setBusy(key)
    let ok = false
    try {
      await fn()
      ok = true
      if (done) notify.success(done, undo ? { action: undo } : undefined)
    } catch (err) {
      // Tekillik ihlali arıza değil bilgi: neden kodu yalnız gerçek arızada eklenir.
      const note = err?.code === DV_DUPLICATE_UPN ? undefined : causeNote(t, "dataverse", err)
      notify.error(t("authz.inbox.failed"), {
        description: [t(writeErrorKey(err)), note].filter(Boolean).join(" "),
      })
    }
    try {
      await ctx.reload?.()
    } finally {
      bumpRequestCount()
      setBusy(null)
    }
    return ok
  }

  return { busy, run }
}
