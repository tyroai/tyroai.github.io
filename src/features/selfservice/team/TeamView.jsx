import { useCallback, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshButton } from "@/components/common/RefreshButton"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePresence } from "@/hooks/usePresence"
import { useSelfServiceTeam } from "@/hooks/useSelfServiceTeam"
import { useTeamDates } from "@/hooks/useTeamDates"
import { memberKey } from "@/lib/selfServiceTeamQuery"
import { selfMember } from "@/lib/teamCircle"
import { cn } from "@/lib/utils"
import { AskPopover } from "../ask/AskPopover"
import { usePhone } from "../layout/phone"
import { updatedText } from "../period/updatedText"
import { MemberSheet } from "./MemberSheet"
import { TeamList } from "./TeamList"
import { TextTabs } from "../board/TextTabs"
import { ErrorCause } from "@/components/common/ErrorCause"
import { TeamNotice } from "./TeamNotice"
import { TeamSummary } from "./TeamSummary"
import { YearEndLeave } from "./YearEndLeave"
import { TeamTimeline } from "./TeamTimeline"
import { TeamUpcoming } from "./TeamUpcoming"
import { byComposition, peopleText } from "./teamText"
import { useTeamView } from "./useTeamView"
import { ViewAsBanner, ViewAsControl } from "./ViewAsControl"

/** Yükleme iskeleti — özet, çizelge ve liste gerçek yerlerinde (zıplama yok). */
function TeamSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 @[40rem]/ss:mt-5">
      <span className="ms-skeleton block h-8 w-48 rounded-full" />
      <span className="ms-skeleton mt-3 block h-16 rounded-[1.25rem] @[44rem]/ss:h-[4.75rem]" />
      <span className="ms-skeleton mt-5 block h-56 rounded-2xl" />
      <div className="mt-5 space-y-px overflow-hidden rounded-2xl">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ms-skeleton block h-14" />
        ))}
      </div>
    </div>
  )
}

/**
 * "EKİBİM" — ekibin izin görünümü (ERP self servisinin Ekibim sekmesinin karşılığı; ekip
 * Anasayfa'daki "Çevrem"le aynı: yönetici, aynı yöneticiye bağlılar, bana bağlılar): özet (bugün
 * · bu hafta · ekip), geniş kapta izin çizelgesi (doğum günü ve iş yıl dönümü rozetleriyle;
 * dönemler arası gezinilir, 6 hafta · 3 ay; dar kapta aynı dönemin "Yaklaşanlar" listesi), ekip listesi ("Bana bağlı olanlar" · "Ekip arkadaşlarım") ve kişi bölmesi. Kimlik
 * Graph'tan, izin ve bakiye ERP'den (`useSelfServiceTeam`); bakiye ve izin türü yalnız bana
 * bağlılarda, yönetici ve ekip arkadaşında yalnız izin günleri (türsüz). ERP okunamazsa liste
 * yine görünür, not kibarca söyler. `onAsk(soru, bağlam?)`: İK asistanına sorar (sohbet
 * rıhtımı); başlıktaki "TYRO'ya sor" ekibin bileşimine göre hazır sorular ve yazı alanı açar
 * (`AskPopover`) — ekip arkadaşı için yalnız tarih sorulur.
 *
 * Kişinin kendisi de listede ve çizelgede ("Sen"; yöneticinin altında, ekip arkadaşlarının
 * başında): `me` = `{ profile, leaves, balance }` — kendi Self Servis verisi, ekip sorgusuna
 * girmez; izin türü ve bakiyesiyle. Ekip sayısına girmez.
 */
export function TeamView({ onAsk, me = null }) {
  const { t, locale } = useLocale()
  const phone = usePhone()
  // Test görünümü (`?as=<upn>`): yalnız uygulama yöneticisinde geçerli; ekip o kişinin gözünden,
  // kendi satırım çizilmez (veri benim yetkimle okunur).
  const [params, setParams] = useSearchParams()
  const isAppAdmin = useIsAppAdmin() === true
  const asUpn = isAppAdmin ? params.get("as") || null : null
  const setAs = useCallback(
    (upn) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (upn) next.set("as", upn)
          else next.delete("as")
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const team = useSelfServiceTeam(true, asUpn)
  const self = useMemo(() => (asUpn ? null : selfMember(me?.profile)), [asUpn, me?.profile])
  const people = useMemo(() => (self ? [self, ...team.people] : team.people), [self, team.people])
  const myLeaves = me?.leaves ?? null
  const myBalance = me?.balance ?? null
  const merged = useMemo(() => {
    if (!self || !myLeaves) return { people, leave: team.leave }
    const mine = { personnel: self.employeeId, relation: self.relation, balance: myBalance }
    return {
      people,
      leave: {
        ...team.leave,
        members: { ...team.leave.members, [memberKey(self)]: { ...mine, leaves: myLeaves } },
      },
    }
  }, [self, people, team.leave, myLeaves, myBalance])
  // Doğum günü (gün-ay) ve kıdem tarihi İK görünümünden; okunamazsa yalnız Graph'ın işe girişi.
  const dates = useTeamDates(people)
  // Çizelgenin dönemi: null başlangıç = bu hafta; aralık 6 hafta · 3 ay (`TimelineNav`).
  const [nav, setNav] = useState({ start: null, weeks: 6 })
  const view = useTeamView(merged, dates, nav)
  const onNav = useCallback((start) => setNav((v) => ({ ...v, start })), [])
  const onWeeks = useCallback((weeks) => setNav((v) => ({ ...v, weeks })), [])
  const [openKey, setOpenKey] = useState(null)
  // Ekibim'in iki sekmesi: çizelge (telefonda yaklaşanlar) ya da üye listesi.
  const [pane, setPane] = useState("timeline")
  // Bölmeyi açan düğme: kapanınca odak oraya döner (çubuğa fareyle basıldıysa yok).
  const returnTo = useRef(null)
  const openMember = useCallback((key) => {
    const el = document.activeElement
    returnTo.current = el && el !== document.body ? el : null
    setOpenKey(key)
  }, [])
  const addresses = useMemo(() => people.map((p) => p.address), [people])
  const upns = useMemo(() => people.map((p) => p.upn), [people])
  const photos = usePeoplePhotos(addresses)
  const presence = usePresence(upns)
  const leave = team.leave
  // Bölüm bazında durum: bir bölüm düştüyse (`failed`) yalnız o bölüm "error", öteki hazır kalır.
  const part = (name) =>
    leave.status === "ready" && leave.failed?.includes(name) ? "error" : leave.status
  const status = {
    all: leave.status,
    reason: leave.reason,
    leaves: part("leaves"),
    balance: part("balance"),
  }
  const open = openKey ? (view.rows.find((r) => r.key === openKey) ?? null) : null
  const updated = updatedText(leave.updatedAt, locale)
  const shared = { rows: view.rows, photos, presence, onOpen: openMember }
  // Hazır sorular ekibin bileşimine göre: ekip arkadaşının izin türü ve bakiyesi sorulmaz.
  const askTab = byComposition(view.summary, ["team", "teammates", "mixed"])
  // İki bölüm varsa çizelgede bölüm satırları da var (`TeamTimeline` › `GroupRow`): iskelet sayar.
  const split = view.groups.length > 1
  // Graph'tan okunamayan parça: liste eksik — not söyler, Yenile ve "Tekrar dene" yeniden sorar.
  const missing = (team.failed?.length ?? 0) > 0

  if (team.status === "loading") return <TeamSkeleton />
  if (!team.people.length) {
    return (
      <>
        {/* Test görünümünde kişi bulunamasa da çıkış yolu görünür. */}
        <ViewAsBanner asUpn={asUpn} subject={team.subject} onClear={() => setAs(null)} />
        <div className="mt-5 rounded-2xl border border-dashed border-border px-6 py-8 text-center text-[0.8125rem] text-muted-foreground">
          <p>
            {t(
              team.status === "ready" && !missing
                ? "selfService.team.empty"
                : "selfService.team.unavailable",
            )}
          </p>
          <ErrorCause detail={team.detail} className="mx-auto" />
        </div>
      </>
    )
  }
  return (
    <section aria-labelledby="ss-team" className="mt-5 min-w-0 @[56rem]/ss:mt-8">
      <div className="flex min-w-0 items-center gap-2">
        <h2
          id="ss-team"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-[0.9375rem] font-semibold",
            !phone && "px-1",
          )}
        >
          {/* Telefonda süs ikonu yok: ekip adı kesilmesin (anahtarda da aynı ad). */}
          {!phone && (
            <HugeiconsIcon
              icon={UserGroupIcon}
              aria-hidden="true"
              className="size-4 shrink-0 text-brand-ink"
            />
          )}
          <span className="truncate">{t("selfService.view.team")}</span>
          <span className="shrink-0 text-[0.8125rem] font-normal text-muted-foreground">
            · {peopleText(team.people.length, t, locale)}
          </span>
        </h2>
        {updated && (
          <span className="hidden shrink-0 whitespace-nowrap text-[0.6875rem] tabular-nums text-muted-foreground @[56rem]/ss:inline">
            {t("selfService.updated", { time: updated })}
          </span>
        )}
        <RefreshButton
          iconOnly
          label={t("selfService.team.refresh")}
          busy={team.busy}
          onRefresh={team.refresh}
        />
        {isAppAdmin && <ViewAsControl asUpn={asUpn} subject={team.subject} onChange={setAs} />}
        <AskPopover tab={askTab} onAsk={onAsk} compact={phone} />
      </div>
      <ViewAsBanner asUpn={asUpn} subject={team.subject} onClear={() => setAs(null)} />
      <TeamNotice
        leave={leave}
        missing={missing}
        missingDetail={team.detail}
        busy={team.busy}
        onRetry={team.refresh}
        onConnect={team.connect}
        className="mt-3"
      />
      <TeamSummary summary={view.summary} rows={view.rows} status={status} className="mt-4" />
      {status.balance === "ready" && <YearEndLeave rows={view.rows} className="mt-3" />}
      {/* Çizelge ve liste alt alta sayfayı çok uzatıyordu: iki sekme, biri görünür. */}
      <TextTabs
        kind="tabs"
        label={t("selfService.team.tabs.label")}
        options={[
          { value: "timeline", label: t("selfService.team.tabs.timeline") },
          { value: "members", label: t("selfService.team.tabs.members"), count: view.summary.size },
        ]}
        value={pane}
        onChange={setPane}
        idPrefix="ss-team-tab"
        controls="ss-team-panel"
        rail
        className="mt-6"
      />
      <div
        id="ss-team-panel"
        role="tabpanel"
        aria-labelledby={`ss-team-tab-${pane}`}
        className="mt-4 min-w-0"
      >
        {pane === "timeline" ? (
          <>
            {status.leaves === "loading" && (
              // Çizelgenin (genişte; iki bölümde bölüm satırları da) ya da yaklaşan izinlerin
              // (telefonda) yaklaşık boyu: zıplama olmasın.
              <span
                aria-hidden="true"
                style={{ "--rows": people.length, "--groups": split ? view.groups.length : 0 }}
                className={cn(
                  "ms-skeleton block h-[calc(2.75rem+min(var(--rows),5)*3.5rem)] rounded-2xl",
                  !phone && "@[48rem]/ss:h-[calc(5.25rem+var(--rows)*2.5rem+var(--groups)*2rem)]",
                )}
              />
            )}
            {status.leaves === "ready" &&
              (phone ? (
                // Telefonda (yatayda da) geniş çizelge yok: yaklaşanlar listesi.
                <TeamUpcoming upcoming={view.soon} window={view.window} onNav={onNav} {...shared} />
              ) : (
                <>
                  <TeamTimeline
                    timeline={view.timeline}
                    marks={view.marks}
                    window={view.window}
                    onNav={onNav}
                    onWeeks={onWeeks}
                    groups={view.groups}
                    className="hidden @[48rem]/ss:block"
                    {...shared}
                  />
                  <TeamUpcoming
                    upcoming={view.soon}
                    window={view.window}
                    onNav={onNav}
                    className="@[48rem]/ss:hidden"
                    {...shared}
                  />
                </>
              ))}
          </>
        ) : (
          <TeamList groups={view.groups} status={status} {...shared} />
        )}
      </div>
      <MemberSheet
        row={open}
        rows={view.rows}
        today={view.today}
        status={status}
        onOpenChange={(o) => !o && setOpenKey(null)}
        onAsk={onAsk}
        onSwitch={setOpenKey}
        returnTo={returnTo}
      />
    </section>
  )
}
