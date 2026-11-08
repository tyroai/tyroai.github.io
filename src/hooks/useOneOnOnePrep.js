import { useCallback, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"

/**
 * "Hazırlan"ın yönetici katmanı (`lib/oneOnOne`): toplantı doğrudan bağlınla 1:1 ise bağlam
 * toplanıp isteme eklenir (en çok birkaç saniye; `busy`), değilse eskisi gibi hemen. Bağlılar
 * listesi ilk basışta sorulur (sessiz, önbellekli) — Anasayfa açılışında istek yok. Toplama kodu
 * (ERP, Planner, toplantı özeti) tıklamada iner: geri sayım penceresi her sayfada ve ilk pakette.
 * `prepare(event, t, locale, extra)`: yüzeyin kendi hazırla işlevi.
 */
export function useOneOnOnePrep(prepare) {
  const { t, locale } = useLocale()
  const { instance, accounts } = useMsal()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async (event) => {
      const account = accounts[0] ?? null
      if (!account) return prepare(event, t, locale)
      setBusy(true)
      let extra = null
      try {
        const [{ cachedDirectReports, loadDirectReports }, oneOnOne, text] = await Promise.all([
          import("@/lib/directReports"),
          import("@/lib/oneOnOne"),
          import("@/lib/oneOnOneText"),
        ])
        const reports =
          cachedDirectReports(account.homeAccountId) ?? (await loadDirectReports(instance, account))
        const person = oneOnOne.oneOnOneReport(event, reports?.people, account.username)
        if (person) {
          const data = await oneOnOne.gatherOneOnOne(instance, account, person)
          extra = text.oneOnOneContext(person, data, t, locale)
        }
      } catch {
        // Bağlam toplanamadı: istem eskisi gibi gider.
      } finally {
        setBusy(false)
      }
      prepare(event, t, locale, extra)
    },
    [accounts, instance, prepare, t, locale],
  )
  return { run, busy }
}
