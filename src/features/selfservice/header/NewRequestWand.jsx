import { useCallback, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ActionButton } from "@/components/common/ActionButton"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import { NewMenuOption } from "@/components/common/new-menu/NewMenuOption"
import { CoachTour } from "@/components/tour/CoachTour"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { NarrateChips } from "../narrate/NarrateChips"
import { NarrateField } from "../narrate/NarrateField"
import { useNarrate } from "../narrate/useNarrate"
import { useDraftKinds } from "../request/useDraftKinds"
import { useNewKinds } from "./useNewKinds"
import "./newRequestMenu.css"

// Anlat'ın ilk açılış ipucu (`CoachTour`) gövdeye çiziliyor: ona basmak menüyü kapatmasın.
const fromCoach = (e) => {
  const el = e.detail?.originalEvent?.target ?? e.target
  return el instanceof Element && Boolean(el.closest("[data-coach]"))
}

/**
 * YENİ TALEP — sekme şeridinin sağ ucunda artı simgeli "Yeni" düğmesi (Takvim'in Yeni düğmesi gibi:
 * aynı artı, aynı hap köşe).
 * Basınca Takvim'in Yeni menüsünün aynısı açılır: sağ kenarı düğmede, sola doğru, buzlu cam yüzey
 * (sayfa bulanmaz, yalnız menünün arkası; `common/new-menu`). İçinde talep türleri (izin · masraf ·
 * iş avansı; politikadaki kişide dördüncü Temsilci ata, `useNewKinds`) tonlu simge, ad ve tek satır
 * açıklamayla; yarım kalan taslağın yanında "taslak". Türkçede en üstte Anlat kutusu (açılınca odak
 * onda): cümle yazılınca seçenekler çekilir, kutunun altında "anladığım" çipleri belirir; Enter formu
 * dolu açar (`onNew(tür, düğme, { values, text })`). Boş kutuda aşağı ok seçeneklere iner. Escape ve
 * dışarı dokunuş kapatır (Escape sohbet rıhtımına geçmez); seçim formu açar (`onNew(tür, düğme)`).
 * Telefondaki karşılığı `NewRequestFab`.
 */
export function NewRequestWand({ onNew }) {
  const { t } = useLocale()
  const drafts = useDraftKinds()
  const kinds = useNewKinds()
  const [open, setOpenState] = useState(false)
  const fabRef = useRef(null)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const canDelegate = kinds.some((k) => k.id === "delegate")
  const nar = useNarrate(null, { delegate: canDelegate })
  const { setText } = nar
  const ask = nar.enabled
  const typing = ask && nar.text.trim() !== ""
  // Kapanınca yazı silinir: menü her açılışta boş kutuyla gelir.
  const setOpen = useCallback(
    (next) => {
      setOpenState(next)
      if (!next) setText("")
    },
    [setText],
  )

  const pick = (kind, preset) => {
    setOpen(false)
    onNew(kind, fabRef.current, preset)
  }
  const submit = () => {
    const r = nar.result
    if (r?.kind) pick(r.kind, { values: r.values, rows: r.rows, head: r.head, text: r.text })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Sayfanın ana eylemi: Takvim'in "Yeni"si ile aynı (araç çubuğu standardı). */}
        <ActionButton
          ref={fabRef}
          data-tour="ss-new"
          tone="prominent"
          size="toolbar"
          aria-label={t("selfService.new.label")}
          title={open ? undefined : t("selfService.new.hint")}
          className="relative"
        >
          <HugeiconsIcon icon={Add01Icon} aria-hidden="true" strokeWidth={2.4} />
          {t("selfService.new.short")}
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label={t("selfService.new.label")}
        className="nm-glass ss-new"
        // Açılınca odak Anlat kutusunda: menü açılır açılmaz yazılabilir.
        onOpenAutoFocus={(e) => {
          if (!ask) return
          e.preventDefault()
          inputRef.current?.focus()
        }}
        // Sohbet rıhtımı pencerede Escape dinliyor: menüyü kapatan Escape rıhtımı da kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onInteractOutside={(e) => fromCoach(e) && e.preventDefault()}
      >
        <div ref={bodyRef} className="ss-new-body">
          {ask && (
            <div className="ss-new-ask">
              <NarrateField
                inputRef={inputRef}
                label={t("selfService.narrate.label")}
                text={nar.text}
                setText={nar.setText}
                onSubmit={submit}
                canSubmit={Boolean(nar.result?.kind)}
                submitLabel={t("selfService.narrate.open")}
                examples={[
                  t("selfService.narrate.placeholder"),
                  t("selfService.narrate.placeholderAdvance"),
                  t("selfService.narrate.placeholderExpense"),
                  ...(canDelegate ? [t("selfService.narrate.placeholderDelegate")] : []),
                ]}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowDown" || typing) return
                  e.preventDefault()
                  bodyRef.current?.querySelector(".nm-opt")?.focus()
                }}
                className="ss-new-ask-field"
              />
              <CoachTour id="narrate" when={open} />
              {typing && (
                <div className="ss-new-ask-more">
                  <NarrateChips result={nar.result} showForm />
                  {nar.result?.kind && (
                    <p className="ss-new-ask-hint">
                      {t("selfService.narrate.enter", { key: "↵" })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!typing &&
            kinds.map((item) => (
              <NewMenuOption
                key={item.id}
                tone={item.id}
                icon={item.cta}
                title={t(`selfService.cta.${item.id}`)}
                sub={t(`selfService.new.desc.${item.id}`)}
                badge={drafts.includes(item.id) ? t("selfService.new.draft") : null}
                onClick={() => pick(item.id)}
              />
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
