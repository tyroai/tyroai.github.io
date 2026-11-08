import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { usePhoneLayout } from "@/features/selfservice/layout/phone"
import { afterBackSettles } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { InboxEmpty, InboxError, InboxGate, InboxSkeleton } from "../requests/InboxParts"
import { SearchBox } from "../requests/SearchBox"
import { useSlashFocus } from "../requests/useSlashFocus"
import { AppDetailPanel } from "./AppDetailPanel"
import { AppLogo } from "./AppLogo"
import { CountText, GroupNote } from "./AppBits"
import { buildAppIndex, groupApps } from "./appIndex"
import { useCatalogLookup } from "./useCatalogLookup"

const EYEBROW =
  "px-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"

/** Tek uygulama satırı: logo · ad (+ grup çipi) · bekleyen talep · kişi sayısı · ›. */
function AppRow({ app, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        <AppLogo app={app.group === "other" ? null : app} name={app.name} />
        <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{app.name}</span>
        {app.pending > 0 && (
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-warning/12 px-2 text-xs font-medium tabular-nums text-warning-ink">
            <CountText base="authz.apps.pending" n={app.pending} />
          </span>
        )}
        <span className="min-w-16 shrink-0 whitespace-nowrap text-end text-[0.8125rem] tabular-nums text-muted-foreground @[36rem]/apps:min-w-24">
          {/* Kilitsiz uygulamada "0 kişi" bilgi değil gürültü: yalnız yazılı kayıt varsa. */}
          {app.group === "business" && !app.people ? null : (
            <CountText base="authz.apps.people" n={app.people} />
          )}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/60 rtl:rotate-180"
          strokeWidth={2}
        />
      </button>
    </li>
  )
}

/**
 * Uygulamalar sekmesinin gövdesi — uygulamadan kişiye bakış (Okta / Entra "Users and groups",
 * Google Workspace uygulama erişimi). Katalog gruplu (Asistanlar · AI ürünleri · İş
 * uygulamaları) + satırlarda yazılı ama katalogda olmayan adlar (⚠). Satır ayrıntıyı açar:
 * masaüstünde sağ bölme, telefonda tam boy çekmece. `onShowUsers(appName)` kabuğu Kişiler
 * sekmesine bu uygulamayla geçirir.
 */
export function AppsDirectory({ ctx, onShowUsers }) {
  const { t, locale } = useLocale()
  const lookup = useCatalogLookup()
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const phone = usePhoneLayout(rootRef)
  useSlashFocus(searchRef)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("name")
  const [detail, setDetail] = useState({ key: null, open: false })

  const index = useMemo(
    () => buildAppIndex(lookup, ctx.authorizations, ctx.requests),
    [lookup, ctx.authorizations, ctx.requests],
  )
  const groups = useMemo(
    () => groupApps(index, { query, sort, locale }),
    [index, query, sort, locale],
  )
  const selected = detail.key ? (index.find((a) => a.key === detail.key) ?? null) : null

  const firstLoad =
    (ctx.status === "loading" || ctx.status === "idle") && !ctx.authorizations?.length && !ctx.error

  return (
    <section
      ref={rootRef}
      aria-labelledby="authz-apps-h"
      className="@container/apps flex max-w-5xl flex-col gap-4"
    >
      <h2 id="authz-apps-h" className="sr-only">
        {t("authz.apps.heading")}
      </h2>
      {!ctx.allowed ? (
        <InboxGate text={t(ctx.gateKey)} />
      ) : (
        <>
          <div className="flex flex-col gap-3 @[40rem]/apps:flex-row @[40rem]/apps:items-center">
            <SearchBox
              ref={searchRef}
              value={query}
              onChange={setQuery}
              placeholder={t("authz.apps.search")}
              className="@[40rem]/apps:max-w-80"
            />
            <TextTabs
              label={t("authz.apps.sort")}
              value={sort}
              onChange={setSort}
              size="sm"
              fill={phone}
              className={cn("@[40rem]/apps:ms-auto", phone && "@[40rem]/apps:min-w-56")}
              options={[
                { value: "name", label: t("authz.apps.sort.name") },
                { value: "people", label: t("authz.apps.sort.people") },
                { value: "pending", label: t("authz.apps.sort.pending") },
              ]}
            />
          </div>

          {ctx.error ? <InboxError ctx={ctx} /> : null}

          {firstLoad ? (
            <InboxSkeleton rows={6} />
          ) : ctx.error && !ctx.authorizations?.length ? null : groups.length === 0 ? (
            <InboxEmpty quiet title={query ? t("authz.search.empty") : t("authz.apps.empty")} />
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((g) => (
                <div key={g.id} className="space-y-2">
                  <h3
                    lang={locale}
                    className={cn(
                      EYEBROW,
                      "flex flex-wrap items-center gap-x-2 gap-y-0.5",
                      g.id === "other" && "text-warning-ink",
                    )}
                  >
                    {t(`authz.ws.group.${g.id}`)}
                    <span className="tabular-nums tracking-normal">{g.apps.length}</span>
                    <GroupNote group={g.id} />
                  </h3>
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
                    {g.apps.map((app) => (
                      <AppRow
                        key={app.key}
                        app={app}
                        onOpen={() => setDetail({ key: app.key, open: true })}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <AppDetailPanel
            ctx={ctx}
            app={selected}
            open={detail.open && !!selected}
            phone={phone}
            onClose={() => setDetail((d) => ({ ...d, open: false }))}
            onShowUsers={
              onShowUsers
                ? (name) => {
                    setDetail((d) => ({ ...d, open: false }))
                    // Bölmenin Geri adımı geri alınırken sekme değişirse o yolculuk yeni adresi yerdi.
                    afterBackSettles(() => onShowUsers(name))
                  }
                : null
            }
          />
        </>
      )}
    </section>
  )
}
