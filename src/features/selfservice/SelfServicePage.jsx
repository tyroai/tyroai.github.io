import "@/lib/i18n/authz"
import "@/lib/i18n/selfService"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useLocale } from "@/hooks/useLocale"
import { useSelfService } from "@/hooks/useSelfService"
import { useSelfServiceProfile } from "@/hooks/useSelfServiceProfile"
import { useToday } from "@/hooks/useToday"
import { requestOpenChat, setPendingAsk, setPendingFiles } from "@/lib/chatBus"
import { notify } from "@/lib/notify"
import { nextAccrual } from "@/lib/selfServiceAccrual"
import { yearsOf } from "@/lib/selfServiceModel"
import { withNames } from "@/lib/selfServiceNames"
import { nextParams, readParams } from "@/features/selfservice/lib/selfServiceParams"
import { TIBOT_PATH } from "@/lib/tibotPolicy"
import { cn } from "@/lib/utils"
import { RecordSheet } from "./detail/RecordSheet"
import { HeroTray } from "./header/HeroTray"
import { RequestWatchLine } from "./header/RequestWatchLine"
import { SelfHero } from "./header/SelfHero"
import { PhoneContext, usePageLayout } from "./layout/phone"
import { PageShell } from "@/components/layout/PageShell"
import { recordQuestion } from "./recordText"
import { LazyRequestDialog } from "./request/LazyRequestDialog"
import { LazyDelegateDialog } from "./request/delegate/LazyDelegateDialog"
import { MyRecords } from "./MyRecords"
import { BoardSkeleton, SelfServiceState } from "./SelfServiceStates"
import { tabOf } from "./kinds"
import { byComposition } from "./team/teamText"
import { TeamView } from "./team/TeamView"
import { useNewRecordWatch } from "./useNewRecordWatch"
import { useRecordsView } from "./useRecordsView"
import { useRequestDialogs } from "./useRequestDialogs"

// Self Servis soruları birincil asistana (İK araçları onda; ayrı bir İK asistanı yok).
const HR_AGENT = "tyroOffice"
const THIS_YEAR = new Date().getFullYear()
// Fareli cihazda soru sorulunca imleç sohbetin yazma alanına geçer; dokunmatikte klavye açılmasın.
const finePointer = () => Boolean(window.matchMedia?.("(pointer: fine)").matches)

/** Kayıt adresteki `ref` ile aranır: izinde satır kimliği, masraf/avansta numara (büyük/küçük harf duyarsız). */
function findRecord(data, tab, ref) {
  if (!data || !ref) return null
  const list = data[tabOf(tab).data] ?? []
  const want = String(ref).toLowerCase()
  return list.find((r) => String(r.id).toLowerCase() === want) ?? null
}

/**
 * SELF SERVİS — kişinin profil başlığı (Graph birincil: unvan, departman, sicil, hizmet süresi,
 * bağlı olduğu kişi, ekip) ve ERP'deki izin, izin bakiyesi, masraf ve iş avansı kayıtları;
 * sohbette oluşturulan talepler buraya bağlanır (`?tab=expense&ref=HRMS-…`). İki görünüm:
 * "Bilgilerim" (dönem · özet · sekmeler · tek kolon liste; rapor bölmede) ve ekibi olanlarda (yönetici, aynı
 * yöneticiye bağlılar, bana bağlılar) "Ekibim" (`view=team`). Seçimler adreste
 * (`features/selfservice/lib/selfServiceParams.js`). Telefonda (dar kap ya da yatay telefon) telefon düzeni
 * (`layout/phone.js`): kart tek sütun, özet listenin üstünde. Yeni talep her boyda sağ altta yüzen
 * sekme şeridinin sağındaki "Yeni" düğmesinde (`NewRequestWand`).
 * Ayrıntı: docs/features/self-servis.md, docs/features/self-servis-ux.md.
 */
export function SelfServicePage() {
  const { t, locale } = useLocale()
  const box = useRef(null)
  const { phone, hero } = usePageLayout(box)
  const ss = useSelfService()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  // Eski bağlantı (Ticket eskiden burada bir sekmeydi): Ticket sayfasına.
  useEffect(() => {
    if (params.get("tab") === "tickets") navigate(TIBOT_PATH, { replace: true })
  }, [params, navigate])
  const raw = ss.status === "ready" ? ss.data : null
  // Dile bağlı adlar (izin türü, avans amacı, durum) bir kez: liste, arama ve özet bunları kullanır.
  const data = useMemo(() => (raw ? withNames(raw, t) : null), [raw, t])
  const years = useMemo(
    () => (data ? yearsOf(data.leaves, data.expenses, data.advances) : []),
    [data],
  )
  const sel = useMemo(() => readParams(params, { years, thisYear: THIS_YEAR }), [params, years])
  // Seçimler geçmişi kirletmez (`replace`); yalnız kayıt açmak bir adım ekler (`push`): Geri
  // tuşu açık kaydı kapatır, sayfadan çıkarmaz.
  const update = useCallback(
    (patch, { push = false } = {}) =>
      setParams((prev) => nextParams(prev, patch), { replace: !push }),
    [setParams],
  )
  // Arama yerel ve sekmeye bağlı: sekme değişince boşalır (izinde "taksi" aramak boş liste olurdu).
  const [search, setSearch] = useState({ tab: sel.tab, q: "" })
  const query = search.tab === sel.tab ? search.q : ""
  const setQuery = useCallback((q) => setSearch({ tab: sel.tab, q }), [sel.tab])

  const profile = useSelfServiceProfile(raw?.worker ?? null, {
    erpLoading: ss.status === "loading",
  })
  // İzin formu kalan bakiyeyi de basar (`leaveFormSheet`).
  const person = useMemo(
    () => ({ profile, worker: raw?.worker ?? null, balance: raw?.balance ?? null }),
    [profile, raw],
  )
  // Sonraki izin hak edişi (tahmin): profil başlığındaki işe giriş günü. "Bugün" gün değişince
  // yenilenir: sekme gece açık kalsa da "x gün sonra" eskimez.
  const hireTime = profile.hireDate?.getTime() ?? null
  const today = useToday()
  const accrual = useMemo(
    () => (hireTime == null ? null : nextAccrual(new Date(hireTime), today)),
    [hireTime, today],
  )
  // Ekip = yönetici + aynı yöneticiye bağlılar + bana bağlılar (`useMyTeam`); yüklenirken o ana
  // dek gelenler: yönetici bilinince anahtar çıkar, sayı ekip tamamlanınca.
  const team = profile.team ?? {}
  const teamPending = Boolean(profile.pending?.team)
  const hasTeam = (team.size ?? 0) > 0
  // Ekip henüz gelmediyse `view=team` bağlantısı Bilgilerim'i bir an çizmesin.
  const teamView = sel.view === "team" && (hasTeam || teamPending)
  const view = useRecordsView({ data, sel, query })
  // Ekibim'de kişinin kendi satırı: kendi izinleri ve bakiyesi (ekip sorgusuna girmez).
  const me = useMemo(
    () => ({ profile, leaves: data?.leaves ?? null, balance: raw?.balance ?? null }),
    [profile, data, raw],
  )
  // Gözcünün yoklaması sessiz: düşerse yüklü sayfa kalır (`ss.pollFailed`).
  const watch = useNewRecordWatch({ data, refresh: ss.poll })
  const watchSlot = useRef(null)
  const open = findRecord(data, sel.tab, sel.ref)

  // Sohbetten gelen bağlantının kaydı başka bir yıldaysa liste o yıla geçer: satır vurgulu görünsün.
  const openYear = open?.date?.getFullYear()
  useEffect(() => {
    if (openYear && sel.year != null && openYear !== sel.year) update({ year: openYear })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openYear])

  // Soru İK asistanına park edilir, rıhtım açılır. `context`: serbest sorunun konusu
  // ("Masraflarım") — sohbette sorunun önünde görünür.
  const ask = (question, context) => {
    setPendingAsk({ question, context, agent: HR_AGENT })
    requestOpenChat({ focusComposer: finePointer() })
  }
  const askRecord = (r) => ask(recordQuestion(r, t, locale))
  // Yeni talep: önce form (`request/RequestDialog`); "TYRO'ya gönder" şablonun cümlesini (ve
  // masraf fişlerini) İK asistanına yollar, konuşma rıhtımda sürer. Talep ERP'ye yansıyana kadar
  // sayfa yoklar (`useNewRecordWatch`).
  const { form, setForm, delegate, setDelegate, onNew } = useRequestDialogs({
    status: ss.status,
    params,
    setParams,
  })
  // Durum satırının cümlesi: talep sohbette mi ("TYRO'da") yoksa doğrudan ERP'de mi.
  const [watchVia, setWatchVia] = useState("chat")
  const onSubmitRequest = (kind, { text, files, card }) => {
    setPendingFiles(files)
    setPendingAsk({ question: text, agent: HR_AGENT, card })
    setForm(null)
    requestOpenChat({ focusComposer: finePointer() })
    setWatchVia("chat")
    watch.start(kind)
  }
  // "Kaydı göster" (ERP penceresinin ✓'sinde): ayrıntı HEMEN açılır — kaydın az önce yazılan hâliyle
  // (`preview`, durum "Onayda"); kayıt listeye gelince ERP'deki hâline geçer. `number`: masrafın
  // numarası (listede doğrudan aranır); izinde numara yok — gözcünün yakaladığı ilk yeni izin.
  const [showNext, setShowNext] = useState(null)
  // "Gönder"in ERP yolu (`request/erp/`): kayıt ERP'de, sohbet açılmaz; liste hemen bir kez yoklanır
  // (gözcünün ilk adımı 45 sn), odak durum satırının kabına.
  const onErpDone = (kind, result) => {
    setForm(null)
    setWatchVia("erp")
    watch.start(kind)
    setTimeout(ss.poll, 1500)
    if (result.show) {
      const number = result.number ?? null
      const preview = result.preview && {
        ...result.preview,
        id: number ?? `new-${kind}`,
        number,
        // İzin satırının durumu yok (ERP'de de boş); masraf onaya gitti.
        ...(kind === "expense"
          ? { status: t("selfService.status.pending"), statusKind: "pending" }
          : { statusKind: "none" }),
      }
      setShowNext({ kind, number, preview })
    }
    if (result.partial)
      notify.warning(
        result.number
          ? t("selfService.erp.toast.partial", { number: result.number })
          : t("selfService.erp.partial.title"),
      )
    else if (result.number)
      notify.success(t("selfService.erp.toast.number", { number: result.number }))
    else notify.success(t("selfService.erp.toast.leave"))
    requestAnimationFrame(() => watchSlot.current?.focus({ preventScroll: true }))
  }
  // Kayıt açmak geçmişe adım ekler; kapatmak (×, Escape) o adımı geri alır. Sohbetten gelen
  // bağlantıyla açılan kayıtta adım yok: adresten `ref` silinir.
  const pushed = useRef(null)
  useEffect(() => {
    if (!sel.ref) pushed.current = null
  }, [sel.ref])
  const openRecord = (r, extra) => {
    pushed.current = r.id
    update({ ...extra, tab: r.kind, ref: r.id }, { push: true })
  }
  const showTarget =
    !showNext || !data
      ? null
      : ((showNext.number ? findRecord(data, showNext.kind, showNext.number) : null) ??
        (watch.arrived?.kind === showNext.kind ? watch.arrived : null))
  useEffect(() => {
    if (!showTarget) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bekleyen istek bir kez tüketilir
    setShowNext(null)
    openRecord(showTarget, { view: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTarget])
  const closeRecord = useCallback(
    (o) => {
      if (o) return
      if (pushed.current && pushed.current === sel.ref) {
        pushed.current = null
        navigate(-1)
      } else update({ ref: null })
    },
    [update, navigate, sel.ref],
  )

  const loading = ss.status === "loading"
  // Ekip sekmesi yok: bağlı olunan kişinin yanındaki düğmeyle gidilir, aynı düğme geri döner.
  const teamToggle =
    hasTeam || teamPending
      ? {
          active: teamView,
          count: teamPending ? null : team.size,
          onToggle: () => update({ view: teamView ? "me" : "team", ref: null }),
        }
      : null
  // Dönem ve özet kartın beyaz tepsisinde (geniş ekran; telefonda listenin üstünde). Ekibim'de de
  // durur: kart iki görünümde aynı boyda kalır, ekibe geçmek başka sayfaya geçmiş gibi olmaz.
  // Dar ve kısa kapta kart yalnız kişi (boyu To-Do'nunkiyle aynı): tepsi kartın hemen altında.
  const showTray = !phone && (loading || ss.status === "ready")
  const trayInside = hero === "wide" || hero === "mid"
  const tray = showTray && (
    <HeroTray
      ss={ss}
      data={data}
      view={view}
      sel={sel}
      years={years.length ? years : [THIS_YEAR]}
      update={update}
      accrual={accrual}
      below={!trayInside}
    />
  )
  return (
    <PhoneContext value={phone}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto",
            // Yapışkan sekme şeridi (telefon) klavye odağını örtmesin; kısa ekranda şerit yapışmaz.
            phone && "scroll-pt-24 shortest:scroll-pt-0",
          )}
        >
          {/* Ortak kap (kenar, üst pay, en); alt pay yüzen değneğin altında son satır okunsun diye. */}
          <PageShell className="pb-28">
            <div ref={box} className="@container/ss">
              <h1 className="sr-only">{t("nav.selfService")}</h1>
              {/* To-Do'nun kartı: gradyan, altına marka renginde gölge. Telefonda özet listenin
                  üstünde. */}
              <SelfHero profile={profile} team={teamToggle} band={hero} tray={trayInside && tray} />
              {!trayInside && tray}
              {/* Satır kapanınca odak boşa düşmesin: hep duran kap odağı alır. Talep gönderilince
                  açılan sohbet paneli (telefon) kapanınca da odak buraya döner. */}
              <div
                ref={watchSlot}
                tabIndex={-1}
                data-dock-return={watch.active ? "" : undefined}
                className="outline-none"
              >
                {watch.active && (
                  <RequestWatchLine
                    via={watchVia}
                    arrived={watch.arrived}
                    busy={ss.busy}
                    failed={ss.pollFailed}
                    failDetail={ss.pollDetail}
                    onRefresh={ss.poll}
                    onOpen={(r) => openRecord(r, { view: null })}
                    onDismiss={() => {
                      watchSlot.current?.focus({ preventScroll: true })
                      watch.stop()
                    }}
                  />
                )}
              </div>
              {sel.ref && ss.status === "ready" && !open && !teamView && (
                <p
                  role="status"
                  className="mt-6 rounded-2xl bg-muted/50 px-4 py-3 text-[0.8125rem] text-foreground/80"
                >
                  {/* Adresteki metin yazılmaz: bağlantıyla sayfaya başkasının cümlesi konamasın. */}
                  {t("selfService.refMissing")}
                </p>
              )}
              {teamView ? (
                <TeamView onAsk={ask} me={me} />
              ) : loading ? (
                <BoardSkeleton />
              ) : ss.status === "ready" ? (
                <MyRecords
                  data={data}
                  sel={sel}
                  view={view}
                  years={years.length ? years : [THIS_YEAR]}
                  update={update}
                  query={query}
                  onQuery={setQuery}
                  updatedAt={ss.updatedAt}
                  onRefresh={ss.refresh}
                  busy={ss.busy}
                  onOpen={openRecord}
                  openId={open?.id}
                  onAsk={askRecord}
                  onNew={onNew}
                  person={person}
                  newKeys={watch.newKeys}
                  accrual={accrual}
                />
              ) : (
                <SelfServiceState
                  status={ss.status}
                  detail={ss.detail}
                  onConnect={ss.connect}
                  onRetry={ss.refresh}
                  busy={ss.busy}
                />
              )}
              <p className="mt-12 text-[0.6875rem] text-muted-foreground">
                {t(
                  teamView
                    ? byComposition(team, [
                        "selfService.team.source",
                        "selfService.team.sourceMembers",
                        "selfService.team.sourceMixed",
                      ])
                    : "selfService.source",
                )}
              </p>
            </div>
          </PageShell>
        </div>
        <LazyRequestDialog
          request={form}
          onClose={() => setForm(null)}
          onSubmit={onSubmitRequest}
          balance={raw?.balance ?? null}
          leaves={data?.leaves ?? null}
          teamEnabled={hasTeam}
          advances={data?.advances ?? null}
          expenses={data?.expenses ?? null}
          company={profile.company ?? null}
          me={{ name: profile.name, companyCode: profile.companyCode }}
          erp={{
            alias: raw?.worker?.alias ?? null,
            uploader: profile.name ?? raw?.worker?.name ?? "",
            onDone: onErpDone,
            person,
          }}
        />
        <LazyDelegateDialog open={delegate} onClose={() => setDelegate(null)} />
        {/* Önizleme → listedeki kayıt → adresteki kayıt: arada boş kare yok, pencere kapanıp yeniden açılmaz. */}
        <RecordSheet
          record={teamView ? null : (open ?? showTarget ?? showNext?.preview ?? null)}
          facet={view.filters.facet}
          person={person}
          onOpenChange={(o) => {
            // Önizleme kapatıldıysa kayıt gelince yeniden açılmasın.
            if (!o) setShowNext(null)
            closeRecord(o)
          }}
          onAsk={askRecord}
        />
      </div>
    </PhoneContext>
  )
}
