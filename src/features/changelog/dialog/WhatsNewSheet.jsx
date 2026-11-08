import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { formatLongDate } from "@/lib/date"
import { KindIcon } from "../KindBadge"
import { kindText, pick } from "../entryText"
import { ReadingOrb } from "../card/ReadingOrb"
import "./whatsNewSheet.css"

/**
 * Yenilikler penceresinin görünümü — Apple'ın "What's New" sayfası kalıbı: üstte uygulamanın
 * küresi ve büyük başlık, altında tonlu simgeli satırlar, dipte TEK ana eylem ("Devam").
 * Kapatmak = okundu; ayrı bir "anladım" yok. Masaüstünde ortada pencere (X yok, macOS sayfası gibi:
 * Devam, Esc ya da dışına tıklama kapatır), telefonda uygulamanın alttan çekmecesi.
 * Odak "Devam"da: Return refleksi pencereyi kapatır, ilk "Göster"e atlamaz.
 *
 * `items` sıralı ve kırpılmış gelir; `extra` tavanın üstünde kalan kayıt sayısı (Tümünü gör'de).
 */
export function WhatsNewSheet({ mode, items, extra, newestDate, onClose, onGo }) {
  const { t, locale } = useLocale()
  const phone = useIsMobile()
  const continueRef = useRef(null)
  const focusContinue = (e) => {
    e.preventDefault()
    continueRef.current?.focus()
  }
  const heading = t("whatsNew.title")
  const subtitle =
    mode === "catchup"
      ? t("whatsNew.dialog.introSubtitle")
      : t("whatsNew.dialog.subtitle", { n: String(items.length + extra) })
  const date = formatLongDate(new Date(`${newestDate}T12:00:00`), locale)

  const list = (
    <ul className="wn-list">
      {items.map((e, i) => (
        <li key={e.id} className="wn-row" data-kind={e.kind} style={{ "--i": i }}>
          <span className="wn-glyph" aria-hidden="true">
            <KindIcon kind={e.kind} className="wn-glyph-icon" />
          </span>
          <div className="wn-text">
            <p className="wn-kind">{kindText(t, e.kind, true)}</p>
            <h3 className="wn-row-title">{pick(e.title, locale)}</h3>
            <p className="wn-body">{pick(e.body, locale)}</p>
            {e.to && (
              <button type="button" className="wn-look" onClick={() => onGo(e.to)}>
                {t("whatsNew.goLook")}
                <HugeiconsIcon icon={ArrowRight01Icon} className="wn-look-icon" strokeWidth={2.2} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )

  const foot = (
    <div className="wn-foot">
      <ActionButton
        ref={continueRef}
        tone="prominent"
        size="page"
        className="wn-continue"
        onClick={onClose}
      >
        {t("whatsNew.dialog.continue")}
      </ActionButton>
      <button type="button" className="wn-all" onClick={() => onGo("/whats-new")}>
        {t("whatsNew.seeAll")}
        {extra > 0 && <span className="wn-extra">+{extra}</span>}
        <HugeiconsIcon icon={ArrowRight01Icon} className="wn-look-icon" strokeWidth={2.2} />
      </button>
    </div>
  )

  // Kullanıcı menüsündeki Yenilikler satırının gazete okuyan küresi: aynı yüzün büyüğü.
  const orb = (
    <div className="wn-orb" inert aria-hidden="true">
      <ReadingOrb />
    </div>
  )

  if (phone) {
    return (
      <BottomSheet
        open
        onOpenChange={(next) => !next && onClose()}
        title={heading}
        description={subtitle}
        closeOnBack
        onOpenAutoFocus={focusContinue}
        footer={foot}
      >
        <div className="wn wn--sheet" lang={locale}>
          <header className="wn-hero">
            {orb}
            <p className="wn-date">{date}</p>
            <p className="wn-sub">{subtitle}</p>
          </header>
          {list}
        </div>
      </BottomSheet>
    )
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={focusContinue}
        className="wn-dialog gap-0 overflow-hidden p-0"
      >
        <div className="wn" lang={locale}>
          <header className="wn-hero">
            {orb}
            <p className="wn-date">{date}</p>
            <DialogTitle className="wn-title">{heading}</DialogTitle>
            <DialogDescription className="wn-sub">{subtitle}</DialogDescription>
          </header>
          <div className="wn-scroll">{list}</div>
          {foot}
        </div>
      </DialogContent>
    </Dialog>
  )
}
