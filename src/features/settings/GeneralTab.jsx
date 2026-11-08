import { useId, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon"
import { notify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/useLocale"
import { useTheme } from "@/hooks/useTheme"
import { usePalette } from "@/hooks/usePalette"
import { useConfig } from "@/hooks/useConfig"
import { cn } from "@/lib/utils"
import { Group, Row } from "@/features/profile/ProfilePage/rows"
import {
  clearAllEntries,
  clearEntry,
  formatSize,
  readStorageEntries,
  splitStorageEntries,
  storageTotals,
} from "@/features/profile/ProfilePage/storageInventory"

/**
 * Bu tarayıcının TYRO kayıtları (localStorage dökümü): Profil → Bu tarayıcı. Önce toplam, sonra
 * dolu kayıtlar büyükten küçüğe (iPhone Depolama gibi); boş kayıtlar açılırda, çünkü silinecek
 * bir şeyleri yok. Listede adı olmayan TYRO kayıtları "Diğer" satırlarında görünür. "Tümünü
 * temizle" onay ister: oturum kayıtları dışında hepsi silinir ve sayfa yeniden yüklenir. Props
 * almaz (SettingsPage de bu hâliyle içe aktarır).
 */
export function GeneralTab() {
  const { t, locale } = useLocale()
  const { theme } = useTheme()
  const { palette } = usePalette()
  const config = useConfig()
  const [bump, setBump] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)
  const emptyId = useId()
  const summaryRef = useRef(null)

  // Bilinen dört kaydın içeriği okunur bir özete çevrilir; ötekiler yalnız anahtarıyla.
  const summaries = useMemo(
    () => ({
      "tyro-theme": theme,
      "tyro-palette": palette,
      "tyro-locale-v2": locale,
      "tyro-config-v2": `${config.allAgents.length} agent · ${config.aiApps.length} AI · ${config.businessApps.length}`,
    }),
    [
      theme,
      palette,
      locale,
      config.allAgents.length,
      config.aiApps.length,
      config.businessApps.length,
    ],
  )

  const entries = useMemo(() => {
    void bump
    return readStorageEntries()
  }, [bump])
  const totals = storageTotals(entries)
  const { filled, empty } = splitStorageEntries(entries)

  function refresh() {
    setBump((b) => b + 1)
    notify.success(t("settings.general.toast.refreshed"))
  }

  const labelOf = (entry) => (entry.other ? t("settings.general.storage.other") : t(entry.labelKey))
  // Çok desenli satırda (arayüz hatırlatmaları) desen dizisi yerine var olan kayıtlar, en çok iki.
  const keyText = (entry) => {
    if (entry.other) return entry.key
    const patterns = entry.match ?? [entry.key]
    if (patterns.length <= 2) return patterns.join(" · ")
    const names = entry.keys.length ? entry.keys : patterns
    return names.slice(0, 2).join(" · ") + (names.length > 2 ? ` +${names.length - 2}` : "")
  }

  function clearKey(entry) {
    clearEntry(entry)
    setBump((b) => b + 1)
    notify.success(t("settings.general.toast.cleared", { key: labelOf(entry) }))
    // Silinen satır listeden çıkar: odak boşa düşmesin, güncel toplamda dursun.
    summaryRef.current?.focus()
  }

  function clearAll() {
    clearAllEntries()
    setBump((b) => b + 1)
    notify.success(t("settings.general.toast.clearedAll"))
    setTimeout(() => window.location.reload(), 600)
  }

  const entryRow = (entry) => (
    <Row
      key={entry.id}
      label={labelOf(entry)}
      hint={
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <code className="font-mono text-[0.6875rem] [overflow-wrap:anywhere]">
            {keyText(entry)}
          </code>
          {entry.keys.length > 1 ? (
            <span className="tabular-nums">
              {t("settings.general.storage.keyCount", { n: entry.keys.length })}
            </span>
          ) : null}
          <span className="truncate">
            {entry.present ? (summaries[entry.key] ?? "") : t("settings.general.storage.empty")}
          </span>
        </span>
      }
    >
      {entry.present ? (
        <>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatSize(entry.size, locale)}
          </span>
          <button
            type="button"
            onClick={() => clearKey(entry)}
            aria-label={`${t("settings.general.storage.clearEntry")}: ${labelOf(entry)}`}
            title={t("settings.general.storage.clearEntry")}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-danger/12 hover:text-danger-ink focus-visible:ring-2 focus-visible:ring-ring/60 pointer-coarse:size-11"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          </button>
        </>
      ) : null}
    </Row>
  )

  return (
    <div className="space-y-4">
      {/* Eylemler listenin başında: uzun dökümün sonuna inmeden yenile ya da temizle. */}
      {confirming ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-2xl bg-danger/12 px-4 py-3"
        >
          <p className="min-w-0 flex-1 basis-60 text-sm text-danger-ink">
            {t("profile.storage.confirm")}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            {t("profile.storage.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-danger-ink text-background hover:bg-danger-ink/90"
            onClick={clearAll}
          >
            {t("profile.storage.confirmYes")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="pointer-coarse:h-11"
            onClick={refresh}
          >
            <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
            {t("settings.general.storage.refresh")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger-ink hover:bg-danger/12 hover:text-danger-ink pointer-coarse:h-11"
            onClick={() => setConfirming(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            {t("settings.general.storage.clearAll")}
          </Button>
        </div>
      )}
      <Group footer={t("settings.general.storage.note")}>
        <div ref={summaryRef} tabIndex={-1} className="outline-none">
          <Row label={<span className="font-medium">{t("settings.general.storage.total")}</span>}>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totals.present} / {totals.count}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatSize(totals.size, locale)}
            </span>
          </Row>
        </div>
        {filled.map(entryRow)}
        {empty.length > 0 ? (
          <button
            type="button"
            aria-expanded={showEmpty}
            aria-controls={emptyId}
            onClick={() => setShowEmpty((v) => !v)}
            className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-start text-sm text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 pointer-coarse:min-h-14"
          >
            <span className="flex-1">{t("profile.storage.emptyToggle", { n: empty.length })}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className={cn("size-4 shrink-0 transition-transform", showEmpty && "rotate-180")}
              strokeWidth={2}
            />
          </button>
        ) : null}
        {showEmpty && empty.length > 0 ? (
          <div id={emptyId} className="divide-y divide-border/60">
            {empty.map(entryRow)}
          </div>
        ) : null}
      </Group>
    </div>
  )
}
