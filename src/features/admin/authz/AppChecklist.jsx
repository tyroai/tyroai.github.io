import { useMemo, useState } from "react"
import { IconOrLogo } from "@/components/common/IconOrLogo"
import { SearchInput } from "@/features/security/primitives"
import { Checkbox } from "@/components/ui/checkbox"
import { useConfig } from "@/hooks/useConfig"
import { useLocale } from "@/hooks/useLocale"
import { catalogNameKey } from "@/lib/agentName"
import { groupCatalog } from "@/lib/authzView"
import { fold } from "@/lib/fold"
import { cn } from "@/lib/utils"

const LINK =
  "rounded-md px-1.5 py-0.5 text-[0.75rem] font-semibold text-brand-ink transition-colors hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11 pointer-coarse:px-2.5"

/**
 * Uygulama seçimi — katalog gruplu, gerçek logolu karolar (Anasayfa'daki kartlarla aynı logo) (Asistanlar · AI ürünleri · İş uygulamaları; satırda
 * yazılı ama katalogda olmayan adlar ayrı grupta, kaldırılabilsin), arama, Tümünü seç / Temizle.
 * Düzenleme bölmesi ve yeni yetki kutusu ortak. `extra`: kaydın mevcut adları.
 */
export function AppChecklist({ value, onChange, disabled, extra = [] }) {
  const { t } = useLocale()
  const { allAgents, allAiApps } = useConfig()
  const [query, setQuery] = useState("")
  // "3 seçili" bir filtre de olur (Okta "Atananlar"): kırk satırda seçilileri aramadan görmek.
  const [onlyOn, setOnlyOn] = useState(false)
  const only = onlyOn && value.length > 0
  const groups = useMemo(
    () => groupCatalog({ agents: allAgents, aiApps: allAiApps }, extra),
    [allAgents, allAiApps, extra],
  )
  const keys = useMemo(() => new Set(value.map(catalogNameKey)), [value])
  // Ad → katalog kaydı (logo/ikon); satırdaki eski yazılış da aynı anahtara iner.
  const byKey = useMemo(
    () => new Map([...allAgents, ...allAiApps].map((item) => [catalogNameKey(item.name), item])),
    [allAgents, allAiApps],
  )
  const all = groups.filter((g) => g.id !== "other").flatMap((g) => g.names)
  const needle = fold(query)
  const toggle = (name) =>
    onChange(
      keys.has(catalogNameKey(name))
        ? value.filter((a) => catalogNameKey(a) !== catalogNameKey(name))
        : [...value, name],
    )
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("authz.ws.editor.search")}
          className="max-w-none"
        />
        <button
          type="button"
          aria-pressed={only}
          disabled={!value.length}
          title={t("security.detail.onlySelected")}
          onClick={() => setOnlyOn(!only)}
          className={cn(
            "h-9 shrink-0 rounded-lg px-2.5 text-[0.75rem] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-default pointer-coarse:h-11",
            only
              ? "bg-foreground/[0.08] font-medium text-foreground"
              : "text-muted-foreground enabled:hover:bg-foreground/[0.05] enabled:hover:text-foreground",
          )}
        >
          <span className="sr-only">{t("security.detail.onlySelected")}: </span>
          {t("authz.ws.editor.selected", { n: value.length })}
        </button>
      </div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          className={LINK}
          disabled={disabled}
          onClick={() => onChange([...new Set([...value, ...all])])}
        >
          {t("authz.ws.editor.all")}
        </button>
        <button type="button" className={LINK} disabled={disabled} onClick={() => onChange([])}>
          {t("authz.ws.editor.none")}
        </button>
      </div>
      {groups.map((g) => {
        const names = g.names.filter(
          (n) => (!needle || fold(n).includes(needle)) && (!only || keys.has(catalogNameKey(n))),
        )
        if (!names.length) return null
        return (
          <div key={g.id} className="mb-3 last:mb-0">
            <p className="mb-1 text-[0.6875rem] font-medium text-muted-foreground">
              {t(`authz.ws.group.${g.id}`)}
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {names.map((n) => {
                const on = keys.has(catalogNameKey(n))
                const item = byKey.get(catalogNameKey(n))
                return (
                  <li key={n}>
                    <label
                      className={cn(
                        "flex h-12 cursor-pointer items-center gap-2.5 rounded-xl px-2 text-[0.8125rem] transition-colors pointer-coarse:h-14",
                        on
                          ? "bg-brand/[0.08] text-foreground ring-1 ring-brand/25"
                          : "hover:bg-foreground/[0.04]",
                        g.id === "other" && "text-warning-ink",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-background text-muted-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                        {item?.logo || item?.iconName ? (
                          <IconOrLogo
                            iconName={item.iconName}
                            logo={item.logo}
                            className="size-4"
                            alt=""
                          />
                        ) : (
                          // Logosu da ikonu da olmayan (katalog dışı) ad: baş harfi.
                          <span className="text-[0.6875rem] font-semibold">{n.charAt(0)}</span>
                        )}
                      </span>
                      <span lang="tr" className="min-w-0 flex-1 truncate font-medium">
                        {n}
                      </span>
                      <Checkbox
                        checked={on}
                        disabled={disabled}
                        onCheckedChange={() => toggle(n)}
                        className="me-1"
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
