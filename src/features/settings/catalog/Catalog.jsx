import { useRef } from "react"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { usePhoneLayout } from "@/features/selfservice/layout/phone"
import { useConfig } from "@/hooks/useConfig"
import { useLocale } from "@/hooks/useLocale"
import { KIND, KINDS } from "./catalogLogic"
import { CatalogKind } from "./CatalogKind"
import { Count, ErrorBanner } from "./CatalogStates"
import { useCatalogSub } from "./useCatalogSub"
import { useInView } from "./useInView"

const SHORT = {
  aiApps: "settings.catalog.tab.aiAppsShort",
  businessApps: "settings.catalog.tab.businessAppsShort",
}

/**
 * Katalog yönetimi: altı çizili tür sekmeleri (sayılı, `?sub=`), altında seçili türün listesi.
 * Telefon düzeni kararı kabın eniyle (`usePhoneLayout`): sohbet paneli kabı daraltır.
 * Kap adı `ss`: `TextTabs`'in kısa etiketleri (`short`) bu kaba bakar.
 */
export function Catalog() {
  const { t } = useLocale()
  const config = useConfig()
  const [sub, setSub] = useCatalogSub()
  const root = useRef(null)
  const phone = usePhoneLayout(root)
  const inView = useInView(root)
  // Yalnız okuma hatası (nesne) şeritte; yazma hataları zaten bildirimle söyleniyor.
  const countOf = (k) => {
    const n = (config[KIND[k].all] ?? []).length
    return config.loading && n === 0 ? undefined : <Count n={n} on={k === sub} />
  }
  const readError = config.error && typeof config.error === "object" ? config.error : null
  return (
    <div ref={root} className="@container/ss flex min-w-0 flex-col gap-4">
      <TextTabs
        kind="tabs"
        rail
        fill={phone}
        // Telefonda küçük boy: 360 px'te üç sekme sayılarıyla kesilmeden sığsın (yükseklik yine 44 px).
        size={phone ? "sm" : "md"}
        idPrefix="catalog-tab"
        controls="catalog-panel"
        label={t("settings.catalog.navLabel")}
        value={sub}
        onChange={setSub}
        options={KINDS.map((k) => ({
          value: k,
          label: t(`settings.catalog.tab.${k}`),
          short: SHORT[k] ? t(SHORT[k]) : undefined,
          // Yüklenirken boş liste "0" demesin: sayı henüz bilinmiyor.
          count: countOf(k),
        }))}
      />
      {readError && <ErrorBanner error={readError} onRetry={() => window.location.reload()} />}
      <div id="catalog-panel" role="tabpanel" aria-labelledby={`catalog-tab-${sub}`}>
        <CatalogKind key={sub} kind={sub} phone={phone} inView={inView} />
      </div>
    </div>
  )
}
