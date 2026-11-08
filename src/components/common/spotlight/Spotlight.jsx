import { useEffect, useMemo, useRef, useState } from "react"
import { Command as CommandPrimitive } from "cmdk"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { faqAnchor } from "@/features/help/helpContent"
import { Command, CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { useTheme } from "@/hooks/useTheme"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { rememberQuery } from "@/lib/filesNav"
import { setPeopleFilter } from "@/lib/findScope"
import { browserTimeZone } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { runControlAction } from "./controlActions"
import { SpotlightPane } from "./SpotlightPane"
import { SpotlightPreview } from "./SpotlightPreview"
import { rememberRecent } from "./spotlightRecent"
import { SpotlightRow } from "./SpotlightRow"
import { SCOPES, useSpotlightGroups } from "./useSpotlightGroups"

const PEOPLE_PAGE = "/feed?sec=docs&fsrc=people"
// Son açılanlara yazılan türler; soru, cevap, dosya ve "tümü" satırı tek seferlik.
const RECENT_KINDS = new Set(["person", "office", "page", "external", "action"])

/** Değer `ms` boyunca değişmezse döner — ok tuşuyla gezerken önizleme her satırda istek atmasın. */
function useSettled(value, ms) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return settled
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SPOTLIGHT — header'daki Ara… ve Ctrl/⌘+K'nin tek penceresi
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kutu boşken son açılanlar, sayfalar, eylemler; yazınca kişiler (rehber), ofisler, sayfalar ve
 * alt yerler, Yardım cevapları, dosyalar ve sonda "TYRO'ya sor" (`useSpotlightGroups`). Geniş
 * ekranda sağda seçili sonucun önizlemesi; Enter açar: kişi ve ofis kartı listenin yerinde
 * (`SpotlightPane`, Esc listeye döner), sayfa gider, dosya yeni sekmede, soru sohbete.
 *
 * cmdk süzmez (`shouldFilter=false`): sıra ve gruplar bizim aramamızın. Önizleme cmdk kökünün
 * İÇİNDE ama tuşları köke ulaşmaz — kök Enter'ı yakalayıp düğmeleri çalışmaz yapardı.
 */
export function Spotlight({ open, onOpenChange, onNavigate, onNewChat }) {
  const { t, toggle: toggleLocale } = useLocale()
  const { toggle: toggleTheme } = useTheme()
  const mobile = useIsMobile()
  const now = useMinuteNow()
  const homeTz = useMemo(() => browserTimeZone(), [])
  const inputRef = useRef(null)
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState("all")
  const [selected, setSelected] = useState("")
  const [pane, setPane] = useState(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setQuery("")
      setScope("all")
      setSelected("")
      setPane(null)
    }
  }

  const { groups, loading } = useSpotlightGroups({ open, query, scope })
  const byKey = useMemo(
    () => new Map(groups.flatMap((g) => g.items.map((it) => [it.key, it]))),
    [groups],
  )
  // Seçim listede yoksa (sorgu değişti) ilk sonuç seçilir.
  const first = groups[0]?.items[0]?.key ?? ""
  if (!byKey.has(selected) && selected !== first) setSelected(first)
  const settled = useSettled(selected, 140)
  const preview = byKey.get(settled) ?? null
  const faces = groups
    .flatMap((g) => g.items)
    .filter((it) => it.kind === "person")
    .slice(0, 10)
    .map((it) => it.person.address)
  const photos = usePeoplePhotos(faces)

  const close = () => onOpenChange(false)
  const go = (path) => {
    onNavigate(path)
    close()
  }
  const showOfficePeople = (office) => {
    setPeopleFilter({ kind: "office", id: office.id, label: office.name })
    rememberQuery("")
    go(PEOPLE_PAGE)
  }
  const act = (item) => {
    // Son açılanlardaki satır kendi kimliğiyle (`recent:`) çizilir; hatırlanan asıl öğe.
    if (RECENT_KINDS.has(item.kind)) rememberRecent({ ...item, key: item.of ?? item.key })
    switch (item.kind) {
      case "person":
      case "office":
        setPane(item)
        return
      case "page":
        return go(item.path)
      case "more":
        rememberQuery(query.trim())
        return go(PEOPLE_PAGE)
      case "external":
        window.open(item.href, "_blank", "noopener,noreferrer")
        return close()
      case "faq":
        return go(`/help#${faqAnchor(item.n)}`)
      case "file":
        window.open(item.file.webUrl, "_blank", "noopener,noreferrer")
        return close()
      case "ask":
        setPendingAsk({ question: query.trim(), agent: "tyroOffice" })
        requestOpenChat({ focusComposer: true })
        return close()
      case "action":
        if (item.id === "new-chat") onNewChat?.()
        if (item.id === "theme") toggleTheme()
        if (item.id === "locale") toggleLocale()
        runControlAction(item.id, { go })
        return close()
      default:
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Kart açıkken Esc listeye döner, pencereyi kapatmaz.
        onEscapeKeyDown={(e) => {
          if (!pane) return
          e.preventDefault()
          setPane(null)
        }}
        className={cn(
          // Pencerenin alt dolgusu yok: alt şerit kenara oturur (telefonda yalnız güvenli alan).
          "flex flex-col gap-0 overflow-hidden p-0 pb-[env(safe-area-inset-bottom)] sm:max-w-[46rem] sm:pb-0",
          "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          "sm:top-[12dvh] sm:translate-y-0",
        )}
      >
        <DialogTitle className="sr-only">{t("spotlight.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("header.searchAria")}</DialogDescription>
        {pane ? (
          <SpotlightPane
            item={pane}
            now={now}
            homeTz={homeTz}
            query={query.trim()}
            onBack={() => {
              setPane(null)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            onDone={close}
            onPeople={showOfficePeople}
          />
        ) : (
          <Command
            shouldFilter={false}
            loop
            value={selected}
            onValueChange={setSelected}
            className="min-h-0 flex-1 rounded-none bg-transparent p-0"
          >
            <div className="flex items-center gap-3 border-b border-border/70 px-4">
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-5 shrink-0 text-muted-foreground"
                strokeWidth={1.9}
                aria-hidden="true"
              />
              <CommandPrimitive.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder={t("spotlight.placeholder")}
                autoFocus
                className="no-ios-zoom h-14 min-w-0 flex-1 bg-transparent text-[1rem] outline-none placeholder:text-muted-foreground/80"
              />
              {mobile ? (
                <button
                  type="button"
                  onClick={close}
                  className="h-11 shrink-0 rounded-full px-3 text-[0.8125rem] font-medium text-brand-ink"
                >
                  {t("spotlight.cancel")}
                </button>
              ) : (
                <Kbd aria-hidden="true" className="shrink-0 text-foreground/75">
                  esc
                </Kbd>
              )}
            </div>
            {query.trim() && (
              <ScopeChips
                value={scope}
                onChange={(s) => {
                  setScope(s)
                  inputRef.current?.focus()
                }}
              />
            )}
            <div className="flex min-h-0 flex-1 sm:h-[min(60dvh,28rem)] sm:flex-none">
              <CommandList className="max-h-none min-w-0 flex-1 overflow-y-auto overscroll-contain p-2 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[0.1em]">
                {!loading.people && !loading.files && (
                  <CommandEmpty className="py-10 text-[0.8125rem] text-muted-foreground">
                    {t("cmd.empty")}
                  </CommandEmpty>
                )}
                {loading.people && <Pending text={t("cmd.peopleLoading")} />}
                {groups.map((g) => (
                  <CommandGroup
                    key={g.id}
                    heading={g.id === "ask" ? undefined : t(`spotlight.group.${g.id}`)}
                    className="p-0"
                  >
                    {g.items.map((item) => (
                      <SpotlightRow
                        key={item.key}
                        item={item}
                        query={query.trim()}
                        photo={item.kind === "person" ? photos.get(item.person.address) : null}
                        now={now}
                        homeTz={homeTz}
                        onSelect={act}
                      />
                    ))}
                  </CommandGroup>
                ))}
                {loading.files && <Pending text={t("spotlight.filesLoading")} />}
              </CommandList>
              {!mobile && query.trim() && (
                <aside
                  aria-label={t("spotlight.preview")}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="hidden w-[19.5rem] shrink-0 overflow-y-auto overscroll-contain border-s border-border/70 bg-muted/20 md:block"
                >
                  <SpotlightPreview
                    item={preview}
                    query={query.trim()}
                    now={now}
                    homeTz={homeTz}
                    act={act}
                    close={close}
                    onPeople={showOfficePeople}
                  />
                </aside>
              )}
            </div>
            {!mobile && <Legend />}
          </Command>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Pending({ text }) {
  return (
    <p role="status" className="px-3 py-2 text-[0.75rem] text-muted-foreground">
      {text}
    </p>
  )
}

/** Kapsam: Tümü · Kişiler · Ofisler · Dosyalar · Sayfalar · Yardım (yalnız yazınca). */
function ScopeChips({ value, onChange }) {
  const { t } = useLocale()
  return (
    <div
      role="radiogroup"
      aria-label={t("spotlight.scopeAria")}
      className="flex gap-1.5 overflow-x-auto border-b border-border/70 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SCOPES.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          onClick={() => onChange(s)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-[0.75rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11",
            value === s
              ? "border-brand/30 bg-brand/[0.09] font-semibold text-foreground"
              : "border-border bg-card text-foreground/75 hover:text-foreground",
          )}
        >
          {t(`spotlight.scope.${s}`)}
        </button>
      ))}
    </div>
  )
}

/** Alt şerit: klavye kısayolları (yalnız geniş ekran). */
function Legend() {
  const { t } = useLocale()
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 border-t border-border/70 px-4 py-2 text-[0.6875rem] text-muted-foreground"
    >
      <span className="flex items-center gap-1.5">
        <Kbd className="text-foreground/75">↑</Kbd>
        <Kbd className="text-foreground/75">↓</Kbd>
        {t("spotlight.keys.move")}
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd className="text-foreground/75">↵</Kbd>
        {t("spotlight.keys.open")}
      </span>
      <span className="ms-auto flex items-center gap-1.5">
        <Kbd className="text-foreground/75">esc</Kbd>
        {t("spotlight.keys.close")}
      </span>
    </div>
  )
}
