import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import { faceOf } from "../faceOptions"
import {
  HEADER_IDS,
  HEADER_MAX,
  RENDER_AS,
  addHeaderWidget,
  headerDescKey,
  headerFaceOf,
  headerLookOf,
  headerLooksOf,
  headerTitleKey,
  removeHeaderWidget,
  restoreHeader,
  setHeaderFace,
  setHeaderLook,
  useHeaderWidgets,
} from "../headerStore"
import { HeaderFaceSettings } from "./HeaderFaceSettings"
import { HeaderStrip } from "./HeaderStrip"
import "./headerCatalog.css"

const UNDO_MS = 8000

/**
 * Header kataloğu — her widget'ın header'da nasıl görüneceği, gerçek verinle: kartta header'ın
 * küçük kopyası ve widget'ın kapsülü; seçilince yanda (telefonda altta) ayrıntı: görünüm, gösterilen
 * bilgi, piyasada kurlar, dünya saatinde şehir. Header'dakiler önce. Header'daki widget'ın
 * değişikliği hemen header'a geçer; olmayanınki eklenince (`addHeaderWidget(id, seçimler)`).
 */
export default function HeaderCatalog({ open, onOpenChange, available }) {
  const { t } = useLocale()
  const { items, looks, faces } = useHeaderWidgets()
  const ids = [...items, ...HEADER_IDS.filter((id) => !items.includes(id) && available(id))]
  const [sel, setSel] = useState(() => ids[0] ?? null)
  const [drafts, setDrafts] = useState({})
  const [said, setSaid] = useState("")
  const detail = useRef(null)
  const full = items.length >= HEADER_MAX
  const name = (id) => t(headerTitleKey(id))

  const lookOf = (id) =>
    items.includes(id) ? headerLookOf(looks, id) : (drafts[id]?.look ?? headerLooksOf(id)[0])
  const chipOf = (id) => (items.includes(id) ? looks[id] : drafts[id]?.look)
  const faceOfId = (id) =>
    items.includes(id) ? headerFaceOf(faces, id) : faceOf(id, drafts[id]?.face)
  const draft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }))

  function pick(id) {
    setSel(id)
    // Telefonda ayrıntı listenin altında: seçince oraya.
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 47.99rem)").matches)
        detail.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function add(id) {
    if (!addHeaderWidget(id, drafts[id])) return
    setSaid(t("headerWidgets.say.added", { name: name(id), n: items.length + 1, max: HEADER_MAX }))
  }

  function remove(id) {
    const prev = removeHeaderWidget(id)
    const msg = t("headerWidgets.say.removed", { name: name(id) })
    setSaid(msg)
    notify.info(msg, {
      duration: UNDO_MS,
      action: { label: t("widgets.undo"), onClick: () => restoreHeader(prev) },
    })
  }

  const current = sel && ids.includes(sel) ? sel : ids[0]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-clip p-0 sm:max-h-[88vh] sm:max-w-5xl"
      >
        <DialogHeader className="relative border-b border-border px-5 pt-4 pb-3 sm:px-6">
          <DialogTitle className="text-base font-semibold">
            {t("headerWidgets.catalog.title")}
          </DialogTitle>
          <DialogDescription className="text-[0.8125rem]">
            {t("headerWidgets.catalog.hint")}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 end-3 pointer-coarse:size-11"
              aria-label={t("sheet.close")}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="hc-layout">
          <div className="hc-list">
            <ul
              aria-label={t("headerWidgets.catalog.list")}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {ids.map((id) => (
                <li key={id} className="relative">
                  <button
                    type="button"
                    aria-pressed={id === current}
                    onClick={() => pick(id)}
                    className="hc-tile flex w-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 text-start transition hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <HeaderStrip id={id} chip={chipOf(id)} face={faceOfId(id)} />
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.875rem] font-medium">{name(id)}</span>
                      {items.includes(id) && (
                        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[0.6875rem] font-medium text-brand-ink">
                          {t("headerWidgets.catalog.inHeader")}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-2 text-[0.75rem] text-muted-foreground">
                      {t(headerDescKey(id))}
                    </span>
                  </button>
                  {/* ⓘ kutucuğun köşesinde, düğmenin DIŞINDA (düğme içinde düğme geçersiz). */}
                  <InfoTip
                    text={t(`widgets.info.${RENDER_AS[id] ?? id}`)}
                    label={t("widgets.info.aria", { name: name(id) })}
                    className="absolute top-3 end-3 z-10 size-7 bg-background/90 pointer-coarse:size-11 text-foreground/70 shadow-sm ring-1 ring-border backdrop-blur"
                  />
                </li>
              ))}
            </ul>
          </div>
          <aside ref={detail} aria-label={current ? name(current) : undefined} className="hc-aside">
            {current && (
              <HeaderFaceSettings
                key={current}
                id={current}
                inHeader={items.includes(current)}
                full={full}
                look={lookOf(current)}
                face={faceOfId(current)}
                onLook={(value) =>
                  items.includes(current)
                    ? setHeaderLook(current, value)
                    : draft(current, { look: value })
                }
                onFace={(next) =>
                  items.includes(current)
                    ? setHeaderFace(current, next)
                    : draft(current, { face: next })
                }
                onAdd={() => add(current)}
                onRemove={() => remove(current)}
              />
            )}
          </aside>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {said}
        </p>
      </DialogContent>
    </Dialog>
  )
}
