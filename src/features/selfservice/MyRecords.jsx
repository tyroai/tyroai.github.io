import { motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/common/SectionHeading"
import { Tour } from "@/components/tour/Tour"
import { BoardToolbar } from "./board/BoardToolbar"
import { PhoneToolbar } from "./board/PhoneToolbar"
import { RecordList } from "./board/RecordList"
import { RecordTabs } from "./board/RecordTabs"
import { NewRequestFab } from "./header/NewRequestFab"
import { NewRequestWand } from "./header/NewRequestWand"
import { StickyBar } from "./board/StickyBar"
import { tabOf } from "./kinds"
import { refreshAll } from "./lib/refreshAll"
import { usePhone } from "./layout/phone"
import { exportRecords } from "./period/exportRecords"
import { PhoneSummary } from "./summary/PhoneSummary"

/**
 * "BİLGİLERİM" — ferah tek kolon: bölüm başlığı ("Kayıtların") → altı çizili sekmeler → araç
 * çubuğu → aylık gruplar (beyaz, gölgeli kartlarda). Dönem ve özet geniş ekranda
 * sayfanın gradyan kartında (`SelfHero`), telefonda burada (`PhoneSummary`). Sağ kolon ve rapor bölmesi yok: kırılımlar
 * özet kartının ipucunda; soru kayıt ayrıntısındaki "TYRO'ya sor"da ve sohbette. Sekme değişince gövde yumuşakça belirir.
 * Telefon düzeninde (`usePhone`) özet tek kartta üç değer (`PhoneSummary`), sekmeler yapışkan
 * (`StickyBar`), arama + "Süzgeç" çekmecesi (`PhoneToolbar`), hemen ardından liste.
 * Liste özeti satırı, uyarı çipleri ve "Rapor" düğmesi yok (ürün sahibinin kararı).
 * Seçimler adreste (`update` → `nextParams`), türetilmiş veri `useRecordsView`te.
 * `onNew(tür)`: yeni talep formu
 * (boş listenin eylemi); `accrual`: sonraki izin hak edişi tahmini (`nextAccrual`; işe giriş
 * bilinmiyorsa null) — özet kutusu gösterir.
 */
export function MyRecords({
  data,
  sel,
  view,
  years,
  update,
  query,
  onQuery,
  updatedAt,
  onRefresh,
  busy,
  onOpen,
  openId,
  onAsk,
  newKeys,
  onNew,
  person,
  accrual,
}) {
  const { t } = useLocale()
  const phone = usePhone()
  const reduce = useReducedMotion()
  const year = sel.year
  const tab = sel.tab
  const exportCsv = () => exportRecords(t, { tab, year, view })
  const clearFilters = () => update({ status: null, facet: null, month: null })
  const clear = () => {
    onQuery("")
    clearFilters()
  }
  const total = data?.[tabOf(tab).data]?.length ?? 0
  const filtered = Boolean(query || view.filters.status || view.filters.facet || view.filters.month)

  // Masaüstünde sekmelerin sağ ucunda "Yeni" düğmesi (izin · masraf · iş avansı); ray ikisinin
  // altından geçer. Telefonda sekmeler tam en, "Yeni" sağ altta yüzen düğme (`NewRequestFab`).
  const tabs = (
    <div data-tour="ss-tabs" className="flex items-end gap-3 shadow-[inset_0_-1px_0_var(--border)]">
      <div className="min-w-0 flex-1">
        <RecordTabs data={data} tab={tab} year={year} onTab={(id) => update({ tab: id })} />
      </div>
      {onNew && !phone && (
        <div className="shrink-0 pb-2">
          <NewRequestWand onNew={onNew} />
        </div>
      )}
    </div>
  )
  const filterProps = {
    tab,
    query,
    onQuery,
    view,
    onFacet: (facet) => update({ facet }),
    onMonth: (month) => update({ month }),
    onStatus: (status) => update({ status }),
  }

  return (
    <>
      {/* İlk ziyarette kısa tur: kayıtlar okununca (yüklenirken ve Ekibim'de bu bileşen yok). */}
      <Tour id="selfservice" page />
      {phone && onNew && <NewRequestFab onNew={onNew} />}
      {phone && (
        <PhoneSummary
          data={data}
          summary={view.summary}
          year={year}
          accrual={accrual}
          years={years}
          onYear={(y) => update({ year: y })}
          updatedAt={updatedAt}
          onRefresh={() => refreshAll(onRefresh)}
          busy={busy}
          onExport={exportCsv}
          exportCount={view.shown.length}
          className="mt-6"
        />
      )}
      <section
        aria-labelledby="ss-records"
        className={cn("min-w-0", !phone && "mt-10 @[56rem]/ss:mt-12")}
      >
        {phone ? (
          <h2 id="ss-records" className="sr-only">
            {t("selfService.records")}
          </h2>
        ) : (
          <SectionHeading
            id="ss-records"
            eyebrow={t("selfService.board.eyebrow")}
            title={t("selfService.board.title")}
            className="mb-4"
          />
        )}
        {phone ? <StickyBar>{tabs}</StickyBar> : tabs}
        <div
          id="ss-panel"
          role="tabpanel"
          aria-labelledby={`ss-tab-${tab}`}
          className={phone ? "mt-1.5 min-w-0" : "mt-4 min-w-0"}
        >
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="min-w-0"
          >
            {phone ? (
              <PhoneToolbar {...filterProps} onFilters={(f) => update(f)} />
            ) : (
              <BoardToolbar {...filterProps} onClear={clear} />
            )}
            <RecordList
              tab={tab}
              view={view}
              failed={view.failed}
              filtered={filtered}
              onOpen={onOpen}
              onAsk={onAsk}
              openId={openId}
              person={person}
              newKeys={newKeys}
              onNew={onNew}
              onClear={clear}
              onAllYears={year != null && total > 0 ? () => update({ year: null }) : null}
              pageKey={[tab, year, ...Object.values(view.filters), query].join("|")}
            />
          </motion.div>
        </div>
      </section>
    </>
  )
}
