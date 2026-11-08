import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import FileSearchIcon from "@hugeicons/core-free-icons/FileSearchIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useFilesSearch } from "@/hooks/useFilesSearch"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { rememberQuery } from "@/lib/filesNav"
import { STATUS } from "@/lib/graph"
import {
  freshCount,
  savedRows,
  SEARCH_PAGE,
  searchParams,
} from "@/features/widgets/lib/savedSearch"
import { cn } from "@/lib/utils"
import { FILE_KIND, FILE_OTHER } from "../fileKinds"
import { ago } from "../format"
import { WidgetBody } from "../WidgetBody"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { WidgetOverlay } from "../WidgetOverlay"
import { SavedEditor } from "./SavedEditor"
import { SavedPinForm } from "./SavedPinForm"
import { useSavedSearches } from "./useSavedSearches"

const FILES_TAB = "/feed?sec=docs"

function Row({ r, locale, t }) {
  const [icon, tone] = FILE_KIND[r.type] ?? FILE_OTHER
  return (
    <li>
      <a
        href={r.webUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={r.title}
        className="-mx-2 flex min-h-10 items-center gap-2.5 rounded-xl px-2 transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        {/* Dar kartta tür karesi yok: yer dosya adına kalsın (uzantı adın sonunda). */}
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg @max-[16rem]/widget:hidden",
            tone,
          )}
        >
          <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-medium">{r.title}</span>
          <span className="block truncate text-[0.6875rem] text-muted-foreground">
            {r.container && <span className="@max-[16rem]/widget:hidden">{r.container} · </span>}
            {ago(r.at, locale)}
          </span>
        </span>
        {r.fresh && (
          <>
            <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.59375rem] font-semibold text-brand-ink @max-[16rem]/widget:hidden">
              {t("widgets.saved.new")}
            </span>
            {/* Dar kartta hap yerine nokta: ad kesilmesin. */}
            <span
              role="img"
              aria-label={t("widgets.saved.new")}
              className="hidden size-1.5 shrink-0 rounded-full bg-brand @max-[16rem]/widget:block"
            />
          </>
        )}
      </a>
    </li>
  )
}

/**
 * Kayıtlı arama — CoA, konşimento, sertifika gibi 1–2 aramayı iğnelersin; her birinin en yeni üç
 * dosyası ve son bakışından sonra gelenlere "Yeni" (kendi değiştirdiğin sayılmaz). Arama
 * Dosyalarım'ınki (`useFilesSearch`, bellek önbelleği çıkışta silinir); kayıtta yalnız arama metni
 * ve bakış anı. İşaretler bu ziyaret boyunca kalır, sonraki ziyarette düşer.
 */
export default function SavedSearchWidget({ className }) {
  const { t, locale } = useLocale()
  const { accounts } = useMsal()
  const me = (accounts[0]?.username ?? "").toLowerCase()
  const { feed } = usePageAccess()
  const navigate = useNavigate()
  const { list, add, remove, seen } = useSavedSearches()
  const [pick, setPick] = useState(null)
  const [editing, setEditing] = useState(false)
  // Ziyaretin başındaki bakış anları: "Yeni" işareti açılır açılmaz silinmesin.
  const [visit] = useState(() => new Map(list.map((s) => [s.id, s.seen])))
  const active = list.find((s) => s.id === pick) ?? list[0] ?? null
  const other = list.find((s) => s !== active) ?? null
  const since = (s) => (s ? (visit.get(s.id) ?? s.seen) : 0)
  const activeSince = since(active)
  const otherSince = since(other)
  const res = useFilesSearch(active ? searchParams(active.q) : null, { firstPage: SEARCH_PAGE })
  const otherRes = useFilesSearch(other ? searchParams(other.q) : null, { firstPage: SEARCH_PAGE })
  const ready = res.status === STATUS.ready
  const rows = useMemo(
    () => (ready ? savedRows(res.items, { seen: activeSince, me }) : []),
    [ready, res.items, activeSince, me],
  )
  const otherNew = otherRes.status === STATUS.ready ? freshCount(otherRes.items, otherSince, me) : 0
  const activeId = active?.id
  useEffect(() => {
    if (activeId && ready) seen(activeId)
  }, [activeId, ready, seen])
  const openFiles = (q) => {
    rememberQuery(q)
    setEditing(false)
    navigate(FILES_TAB)
  }
  const editLabel = t("widgets.saved.edit")

  return (
    <WidgetFrame
      id="saved-search"
      title={t("widgets.saved.title")}
      shortTitle={t("widgets.saved.titleShort")}
      icon={FileSearchIcon}
      busy={Boolean(active) && res.status === "loading"}
      className={className}
      action={
        list.length > 0 && (
          <WidgetOverlay
            trigger={
              <FrameAction aria-label={editLabel} title={editLabel} className="px-1.5">
                <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" strokeWidth={2} />
              </FrameAction>
            }
            title={editLabel}
            open={editing}
            onOpenChange={setEditing}
          >
            <SavedEditor
              saved={list}
              onPin={add}
              onRemove={remove}
              onOpen={feed ? openFiles : null}
            />
          </WidgetOverlay>
        )
      }
    >
      {!active ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3">
          <p className="text-[0.8125rem] leading-snug text-muted-foreground @max-[16rem]/widget:hidden">
            {t("widgets.saved.intro")}
          </p>
          <SavedPinForm saved={list} onPin={add} />
        </div>
      ) : (
        <>
          {other && (
            <SegmentedControl
              fill
              label={t("widgets.saved.views")}
              value={active.id}
              onChange={setPick}
              options={list.map((s) => ({
                value: s.id,
                label: s.q,
                title: s.q,
                accessory: s === other && otherNew > 0 && (
                  <span
                    role="img"
                    aria-label={t("widgets.saved.hasNew")}
                    className="size-1.5 shrink-0 rounded-full bg-brand"
                  />
                ),
              }))}
              itemClassName="h-7 px-2.5 text-[0.75rem]"
              className="mt-1"
            />
          )}
          <WidgetBody status={res.status} rows={3}>
            {rows.length ? (
              <ul className="mt-1">
                {rows.map((r) => (
                  <Row key={r.id} r={r} locale={locale} t={t} />
                ))}
              </ul>
            ) : (
              <div className="mt-3 flex flex-col items-start gap-1">
                <p className="text-[0.8125rem] text-muted-foreground">{t("widgets.saved.none")}</p>
                {feed && (
                  <FrameAction onClick={() => openFiles(active.q)} className="-ms-2.5">
                    {t("widgets.saved.openFiles")}
                  </FrameAction>
                )}
              </div>
            )}
          </WidgetBody>
        </>
      )}
    </WidgetFrame>
  )
}
