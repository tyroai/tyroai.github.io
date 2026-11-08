import { useCallback, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { STATUS } from "@/lib/graph"
import { askQuestion } from "@/lib/onenote/onenoteAsk"
import { flattenOneNoteHtml } from "@/lib/onenote/onenoteHtml"
import { crumbOf } from "@/lib/onenote/onenotePages"
import { fetchPageContent } from "@/lib/onenote/onenoteSource"
import { showResultToast } from "@/lib/refreshToast"
import { worstMode } from "@/dev/worstCase/mode"
import { worstOneNoteContent } from "@/dev/worstCase/onenote"

/**
 * Satırdan TYRO'ya: sayfanın düz metni (görselsiz, okuyucunun önbelleğinden ya da tek istek)
 * okunur, okuyucunun "TYRO" menüsüyle AYNI soru tyroOffice'e park edilir ve sohbet açılır.
 * Okunamazsa soru gitmez (boş metinle özet istenmesin), kısa uyarı çıkar.
 */
export function useAskPage() {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const { t } = useLocale()
  const [busyId, setBusyId] = useState(null)

  const ask = useCallback(
    async (page, mode) => {
      setBusyId(page.id)
      // DEV: `?data=…` sahte içerik (src/dev/worstCase); üretimde ölü kod.
      const fake = import.meta.env.DEV && worstMode() ? worstOneNoteContent(page.id) : null
      const res = fake
        ? { status: STATUS.ready, html: flattenOneNoteHtml(fake) }
        : await fetchPageContent(instance, account, page.id, { images: false })
      setBusyId(null)
      if (res.status !== STATUS.ready) {
        showResultToast({ state: "error", title: t("onenote.find.askFailed") })
        return
      }
      const title = page.title || t("onenote.untitled")
      const meta = { title, crumb: crumbOf(page), webUrl: page.webUrl }
      setPendingAsk({ question: askQuestion(mode, meta, res.html, t), agent: "tyroOffice" })
      requestOpenChat()
    },
    [instance, account, t],
  )
  return { busyId, ask }
}
