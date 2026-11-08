import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { useLocale } from "@/hooks/useLocale"
import { NOTE_MAX, STICKY_COLORS } from "./lib/stickyNotes"
import { ColorDots } from "./ColorDots"
import { StickyFocus } from "./StickyFocus"

/**
 * Not yazma/düzenleme kartı — notun KENDİ renginde, yerinde açılır (ayrı pencere yok: yapışkan
 * not hızlı olmalı). ⌘/Ctrl+Enter kaydeder, Escape vazgeçer; boş not kaydedilmez. Yeni notta
 * renk seçilir; var olanın rengi menüden değişir.
 */
export function StickyComposer({
  initial = "",
  color: startColor,
  pickColor,
  quick = false,
  onSave,
  onCancel,
}) {
  const { t } = useLocale()
  const [text, setText] = useState(initial)
  const [color, setColor] = useState(startColor ?? STICKY_COLORS[0])
  const area = useRef(null)
  const [focus, setFocus] = useState(false)
  useEffect(() => {
    const el = area.current
    if (!el) return undefined
    // Dokunmatikte hızlı not kendiliğinden odaklanmaz: pencere açılır açılmaz klavye çıkmasın.
    if (quick && window.matchMedia?.("(pointer: coarse)").matches) return undefined
    const focus = () => {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
    if (!quick) {
      focus()
      return undefined
    }
    // Pencere (Radix) açılışta odağı kendisi yerleştiriyor: hızlı not ondan sonra alır.
    const id = setTimeout(focus, 80)
    return () => clearTimeout(id)
  }, [quick])
  const can = text.trim().length > 0
  // Hızlı not (tepsi/çentik): kaydedince alan boşalır, odakta kalır — art arda yazılır.
  const save = () => {
    if (!can) return
    onSave(text, color)
    setFocus(false)
    if (quick) setText("")
  }
  const cancel = () => (quick ? setText("") : onCancel())
  return (
    <div
      className={quick ? "st-card st-compose st-quick" : "st-card st-compose"}
      data-color={color}
    >
      <textarea
        ref={area}
        dir="auto"
        data-private=""
        value={text}
        maxLength={NOTE_MAX}
        rows={quick ? 2 : 4}
        aria-label={t("widgets.sticky.textLabel")}
        placeholder={t("widgets.sticky.placeholder")}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            save()
          } else if (e.key === "Escape") {
            // Hızlı notta boş alanda Escape pencereyi kapatsın (Radix'e kalsın).
            if (quick && !text) return
            e.preventDefault()
            e.stopPropagation()
            cancel()
          }
        }}
        className="st-area no-ios-zoom"
      />
      {/* Rahat yazma: aynı metin büyük pencerede (kapatınca kartta sürer). */}
      <button
        type="button"
        className="st-expand"
        onClick={() => setFocus(true)}
        aria-label={t("widgets.sticky.expand")}
        title={t("widgets.sticky.expand")}
      >
        <HugeiconsIcon icon={ArrowExpand01Icon} strokeWidth={2} aria-hidden="true" />
      </button>
      <div className="st-compose-foot">
        {pickColor ? <ColorDots value={color} onChange={setColor} /> : <span />}
        <span className="st-compose-actions">
          {(!quick || can) && (
            <ActionButton tone="soft" size="inline" onClick={cancel}>
              {t(quick ? "widgets.sticky.clear" : "widgets.sticky.cancel")}
            </ActionButton>
          )}
          <ActionButton tone="prominent" size="inline" disabled={!can} onClick={save}>
            {t("widgets.sticky.save")}
          </ActionButton>
        </span>
      </div>
      {focus && (
        <StickyFocus
          open
          onOpenChange={setFocus}
          text={text}
          onText={setText}
          color={color}
          onColor={setColor}
          pickColor={pickColor}
          onSave={save}
        />
      )}
    </div>
  )
}
