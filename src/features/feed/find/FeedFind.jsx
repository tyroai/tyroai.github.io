import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { loadCompanyDirectory } from "@/lib/companyDirectory"
import { verticalOf } from "@/lib/findScope"
import { FeedFiles } from "../files/FeedFiles"
import { FindVertical } from "./FindVertical"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  KEŞFET › BUL — kişiler, ofisler ve dosyalar tek kutuda
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kapsam şeridi (`fsrc`): Tümü · Kişiler · Ofisler · OneDrive · SharePoint · Şirket · E-posta
 * ekleri · OneNote. Kişiler ve Ofisler kendi görünümü (`FindVertical`); öbürleri Dosyalarım'ın kaynakları
 * (`FeedFiles`) — Tümü'de arama kişi ve ofis bantlarıyla başlar (`FindBands`), açılışta son
 * dosyaların. Ayrıntı `docs/features/kesfet-bul.md`.
 *
 * Sekme açılınca rehber boşta bir kez okunur: "Tümü"de ilk harfte kişiler hazır olsun.
 */
export function FeedFind({ scrollerRef, now }) {
  const [params] = useSearchParams()
  const vertical = verticalOf(params.get("fsrc"))
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null

  useEffect(() => {
    if (!account) return undefined
    const id = setTimeout(() => loadCompanyDirectory(instance, account), 800)
    return () => clearTimeout(id)
  }, [instance, account])

  return vertical ? (
    <FindVertical vertical={vertical} now={now} />
  ) : (
    <FeedFiles scrollerRef={scrollerRef} now={now} />
  )
}
