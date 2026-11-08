import "@/lib/i18n/security"
import "@/lib/i18n/authz"
import { useMemo, useRef } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useAuthorizationsAdmin } from "@/features/security/hooks/useAuthorizationsAdmin"
import { usePhoneLayout } from "@/features/selfservice/layout/phone"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { ErrorCause } from "@/components/common/ErrorCause"
import { PageShell } from "@/components/layout/PageShell"
import { NewAuthorizationDialog } from "@/features/admin/AuthorizationsPage"
import { isStale } from "@/lib/authzView"
import { formatAgo } from "@/lib/date"
import { cn } from "@/lib/utils"
import { PageHead } from "./shell/PageHead"
import { KpiStrip } from "./shell/KpiStrip"
import { kpiFacts } from "./shell/kpiFacts"
import { useSecurityParams } from "./shell/useSecurityParams"
import { PeopleWorkspace } from "./users/PeopleWorkspace"
import { RequestsInbox } from "./requests/RequestsInbox"
import { AppsDirectory } from "./apps/AppsDirectory"
import { SystemPanel } from "./system/SystemPanel"

/**
 * GÜVENLİK (`/security`) — ~850 kişi × onlarca uygulamanın yönetim konsolu. Sayfa başı, sakin
 * özet şeridi (her sayı bir kısayol) ve dört sekme: Kişiler · Uygulamalar · Talepler · Sistem.
 * Kapı `tyro_isadmin` (`useIsAppAdmin`); Sistem sekmesinin kapısı ayrıca Entra yönetici grubu.
 * Sekme ve liste durumu URL'de (`useSecurityParams`). Ayrıntı: `docs/features/guvenlik.md`.
 */
export function SecurityPage() {
  const { t, locale } = useLocale()
  const rootRef = useRef(null)
  const phone = usePhoneLayout(rootRef)
  const view = useSecurityParams()
  // Kanca sayfada BİR KEZ: sekmeler aynı veriyi ve aynı Yenile'yi paylaşır.
  const ctx = useAuthorizationsAdmin()
  const { authorizations, requests, catalog, known, allowed } = ctx

  // Üç durum üç cümle: bekliyor · soramadık (UNKNOWN, "hayır" değil) · hayır.
  const gateMessage =
    ctx.gateState === "pending"
      ? t("security.gate.pending")
      : ctx.gateState === "unknown"
        ? t("authz.gate.unknown")
        : t("security.gate.denied")

  const counts = useMemo(
    () => ({
      people: authorizations.length,
      admins: authorizations.filter((r) => r.isAdmin).length,
      stale: authorizations.filter((r) => isStale(r, known)).length,
      // Rozet bekleyeni sayar: tamamlanan talep iz için listede, yapılacak iş değil.
      pending: requests.filter((r) => !r.isCompleted).length,
    }),
    [authorizations, requests, known],
  )

  const facts = useMemo(() => kpiFacts({ authorizations, requests }), [authorizations, requests])
  const avg = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(facts.avg)
  const onUsers = view.tab === "users"
  const stats = [
    {
      key: "people",
      label: t("security.kpi.people"),
      value: counts.people,
      caption: facts.avg ? t("security.kpi.cap.people", { n: avg }) : "",
      active: onUsers && view.role === "all" && !view.apps.length && !view.q,
    },
    {
      key: "admins",
      label: t("security.kpi.admins"),
      value: counts.admins,
      caption: t("security.kpi.cap.admins"),
      active: onUsers && view.role === "admins",
    },
    {
      key: "pending",
      label: t("security.kpi.pending"),
      value: counts.pending,
      caption: !counts.pending
        ? t("security.kpi.cap.pendingNone")
        : facts.oldestOn
          ? t("security.kpi.cap.pendingOldest", { ago: formatAgo(facts.oldestOn, locale) })
          : "",
      warn: counts.pending > 0,
      active: view.tab === "requests",
    },
    {
      key: "apps",
      label: t("security.kpi.apps"),
      value: catalog.length,
      caption: facts.top ? t("security.kpi.cap.appsTop", { name: facts.top.name }) : "",
      active: view.tab === "apps",
    },
    {
      key: "stale",
      label: t("security.kpi.stale"),
      value: counts.stale,
      caption: t(counts.stale ? "security.kpi.cap.stale" : "security.kpi.cap.staleNone"),
      warn: counts.stale > 0,
      active: onUsers && view.role === "stale",
    },
  ]
  const pickStat = (key) => {
    if (key === "pending") view.update({ tab: "requests" })
    else if (key === "apps") view.update({ tab: "apps" })
    else
      view.update({
        tab: "users",
        q: "",
        apps: [],
        role: key === "admins" ? "admins" : key === "stale" ? "stale" : "all",
      })
  }

  const tabs = [
    { value: "users", label: t("security.tab.people") },
    { value: "apps", label: t("security.tab.apps") },
    {
      value: "requests",
      label: t("security.tab.requests"),
      // Bekleyen talep göze çarpsın: hangi sekmede olursan ol renkli sayı (kenar çubuğunun rozeti).
      count: counts.pending || null,
      alert: counts.pending > 0,
    },
    { value: "app", label: t("security.tab.system") },
  ]
  // Aramada bulunamayan kişi için yazılan metinle açılır; düğmeden gelen tıklama olayı adres değil.
  const addPerson = (upn) =>
    ctx.setNewRow({ upn: typeof upn === "string" ? upn : "", apps: [], isAdmin: false })

  return (
    // Kap sorgusu (`@container/security`): sohbet paneli açıkken sayfa daralır, viewport değil.
    <PageShell
      ref={rootRef}
      className={cn(
        "@container/security flex h-full flex-col overflow-y-auto overflow-x-hidden pb-12",
        phone ? "gap-4" : "gap-6",
      )}
    >
      <PageHead ctx={ctx} phone={phone} onAdd={addPerson} showActions={allowed} />
      {!allowed ? (
        // Sessizce başka yere atılmaz: yer imiyle gelen uygulamayı bozuk sanmasın.
        <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground dark:bg-white/[0.04]">
          <p>{gateMessage}</p>
          <ErrorCause detail={ctx.gateDetail} className="mx-auto" />
        </div>
      ) : (
        <>
          {(authorizations.length > 0 || ctx.status === "loading" || ctx.status === "idle") && (
            <KpiStrip
              stats={stats}
              onPick={pickStat}
              phone={phone}
              loading={!authorizations.length}
            />
          )}
          {/* Kabın üst payı (pt-4) kadar yukarıda yapışır: satırlar sekmelerin üstünden görünmesin. */}
          <div className={cn(phone && "sticky -top-4 z-20 -mx-4 bg-background px-4")}>
            <TextTabs
              kind="tabs"
              rail
              size={phone ? "md" : "lg"}
              label={t("security.tabs.label")}
              idPrefix="security-tab"
              // Dokunmatikte kısa ad ("Kişiler", "Люди") da 44 px'lik hedef olsun.
              className="pointer-coarse:[&>button]:min-w-11"
              controls="security-panel"
              options={tabs}
              value={view.tab}
              onChange={(tab) => view.update({ tab })}
            />
          </div>
          <div
            id="security-panel"
            role="tabpanel"
            aria-labelledby={`security-tab-${view.tab}`}
            className="min-w-0"
          >
            {view.tab === "users" && (
              <PeopleWorkspace
                ctx={ctx}
                view={view}
                phone={phone}
                onAdd={addPerson}
                scrollRef={rootRef}
              />
            )}
            {view.tab === "apps" && (
              <AppsDirectory
                ctx={ctx}
                onShowUsers={(name) =>
                  view.update({ tab: "users", q: "", role: "all", apps: [name] })
                }
              />
            )}
            {view.tab === "requests" && <RequestsInbox ctx={ctx} />}
            {view.tab === "app" && <SystemPanel />}
          </div>
          <NewAuthorizationDialog ctx={ctx} />
        </>
      )}
    </PageShell>
  )
}
