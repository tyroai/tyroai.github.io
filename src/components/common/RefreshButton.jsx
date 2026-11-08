import { useEffect, useRef } from "react"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import { InlineAction } from "@/components/ui/inline-action"
import { useLocale } from "@/hooks/useLocale"

/**
 * UYGULAMANIN TEK YENİLE DÜĞMESİ — Keşfet'in hapı (`InlineAction`): gri kapsül "⟳ Yenile", basınca
 * kayan yükleme çubuğu, bitince onay dairesi. `iconOnly`: dar yerde (telefon, dar araç çubuğu) aynı
 * düğmenin yalnız simgeli dairesi — okurken simge döner. Her sayfa yalnız kendi yenileme mantığını verir.
 *
 * `onRefresh` söz döndürürse sonucu (`false` = başarısız, onay yok) beklenir; döndürmezse (çoğu
 * kanca "ateşle ve unut") iş `busy` ile izlenir: `busy` açılıp kapanınca onay. `busy` hiç açılmazsa
 * (önbellek anında döndü) kısa bir süre sonra onaylanır — düğme yüklemede asılı kalmaz.
 * Ayrıntı: `docs/design-system.md` › Araç çubuğu standardı.
 */
export function RefreshButton({ onRefresh, busy = false, iconOnly = false, label, className }) {
  const { t } = useLocale()
  const pending = useRef(null)

  useEffect(() => {
    const p = pending.current
    if (!p) return
    if (busy) p.seen = true
    else if (p.seen) {
      pending.current = null
      p.resolve(true)
    }
  }, [busy])

  const run = () => {
    const result = onRefresh?.()
    if (result && typeof result.then === "function") return result
    return new Promise((resolve) => {
      const p = { resolve, seen: false }
      pending.current = p
      setTimeout(() => {
        if (pending.current !== p || p.seen) return
        pending.current = null
        resolve(true)
      }, 600)
    })
  }

  return (
    <InlineAction
      icon={RefreshIcon}
      label={label ?? t("toolbar.refresh")}
      busyLabel={t("toolbar.refreshing")}
      doneLabel={t("toolbar.refreshDone")}
      busy={busy}
      iconOnly={iconOnly}
      onAction={run}
      className={className}
    />
  )
}
