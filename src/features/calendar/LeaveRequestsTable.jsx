import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import { SearchField } from "@/components/common/SearchField"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PhoneContext, usePhoneLayout } from "@/features/selfservice/layout/phone"
import { RecordRow } from "@/features/selfservice/RecordRow"
import { useLocale } from "@/hooks/useLocale"
import { FILTERS, leaveTableRows } from "@/features/calendar/lib/leaveTable"
import { recordKey } from "@/lib/selfServiceModel"
import { dateShort } from "./format"
import { useLeaveDesk } from "./leaveDeskContext"

const PAGE = 6

/**
 * Alt kart: "İzinler ve talepler" — kendi izin kayıtlarım, Self Servis'in izin listesiyle AYNI
 * satırlar (`RecordRow`): üstüne gelince TYRO · ⋯ · İmzala & Mail (`RowActions`), satıra basınca kaydın
 * ayrıntısı (izin masası, takvimin üstünde). Arama (tür, durum, açıklama, tarih) ve durum süzgeci
 * kartın başlığında; ilk altı satır, "Tümünü göster" ile yirmisine kadar, tamamı Self Servis'te.
 * Satırların kap sorguları (`@container/ss`) ve telefon düzeni Self Servis'inkiyle aynı karar.
 */
export function LeaveRequestsTable({ leaves }) {
  const { locale, t } = useLocale()
  const desk = useLeaveDesk()
  const box = useRef(null)
  const phone = usePhoneLayout(box)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [all, setAll] = useState(false)
  const rows = useMemo(
    () =>
      leaveTableRows(leaves, {
        filter,
        query,
        haystack: (r) =>
          `${r.typeName} ${r.statusName} ${r.description} ${dateShort(r.start, locale)} ${dateShort(r.end ?? r.start, locale)}`,
      }),
    [leaves, filter, query, locale],
  )
  if (!desk) return null
  const shown = all ? rows.slice(0, 20) : rows.slice(0, PAGE)
  return (
    <section className="cal-card cal-table-card" aria-labelledby="cal-table-title">
      <header className="cal-table-head">
        <h2 id="cal-table-title">{t("calendar.page.table.title")}</h2>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t("calendar.page.table.search")}
          className="cal-search-table"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cal-icon-btn cal-icon-btn-box"
              data-active={filter !== "all" || undefined}
              aria-label={t("calendar.page.table.filter")}
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                className="cal-ic"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="cal-menu">
            <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
              {FILTERS.map((f) => (
                <DropdownMenuRadioItem key={f} value={f}>
                  {t(`calendar.page.table.f.${f}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {/* Kap hep çizilir: telefon kararı (`usePhoneLayout`) boş listede de kabı ölçer. */}
      <div ref={box} className="@container/ss">
        {shown.length ? (
          <PhoneContext value={phone}>
            <ul className="cal-rows" aria-label={t("calendar.page.table.title")}>
              {shown.map((r) => (
                <RecordRow
                  key={recordKey(r)}
                  record={r}
                  person={desk.person}
                  onOpen={desk.openLeave}
                  onAsk={desk.ask}
                  highlighted={desk.openId === r.id}
                  isNew={desk.newKeys.has(recordKey(r))}
                />
              ))}
            </ul>
          </PhoneContext>
        ) : (
          <p className="cal-empty">
            {leaves?.length ? t("calendar.page.table.noMatch") : t("calendar.page.table.empty")}
          </p>
        )}
      </div>
      <footer className="cal-table-foot">
        {rows.length > PAGE && (
          <button type="button" className="cal-link" onClick={() => setAll((v) => !v)}>
            {all
              ? t("calendar.page.table.showLess")
              : t("calendar.page.table.showAll", { n: Math.min(rows.length, 20) })}
          </button>
        )}
        <Link className="cal-link" to="/self-service?tab=leave">
          {t("calendar.page.table.openAll")}
        </Link>
      </footer>
    </section>
  )
}
