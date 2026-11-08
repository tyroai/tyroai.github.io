import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { PageDockPortal } from "@/components/layout/PageDock"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useLocale } from "@/hooks/useLocale"
import { usePersonProfile } from "@/hooks/usePersonProfile"
import { draftState } from "./detailDraft"
import { PersonDetail, SaveBar } from "./PersonDetail"
import { Initials } from "./PersonRow"

const BADGE = "inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold"

/**
 * Kişinin kartı (M365 kullanıcı kartı): Office fotoğrafı, dizindeki ad, unvan · departman, giriş
 * adresi ve rozetler. Dizin okunamazsa ad yerine adresin yerel kısmı — uydurma ad yok.
 */
function Head({ row, self, onClose, Title = "h2" }) {
  const { t } = useLocale()
  const { profile } = usePersonProfile({ address: row.upn }, true)
  const name = profile?.displayName || row.upn.split("@")[0]
  const sub = [profile?.jobTitle, profile?.department].filter(Boolean).join(" · ")
  return (
    <div className="flex items-start gap-4 border-b border-border/60 px-4 py-4 @[30rem]/detail:px-5">
      <Initials
        upn={row.upn}
        photo={profile?.photo}
        className="size-14 text-sm shadow-sm ring-2 ring-background"
      />
      <div className="min-w-0 flex-1">
        <Title className="truncate text-lg font-semibold leading-tight tracking-tight">
          {name}
        </Title>
        {sub ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{sub}</p> : null}
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.upn}>
          {row.upn}
        </p>
        {(row.isAdmin || self) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.isAdmin && (
              <span className={`${BADGE} bg-brand/[0.1] text-brand-ink`}>
                {t("authz.badge.admin")}
              </span>
            )}
            {self && (
              <span className={`${BADGE} bg-foreground/[0.07] text-foreground/70`}>
                {t("authz.badge.self")}
              </span>
            )}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("security.detail.close")}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

/**
 * Ayrıntının çerçevesi — geniş pencerede kabuğun kenar panelinde, sohbet paneli gibi (modal değil,
 * liste tam genişlikte ve tıklanabilir kalır; kenar tek panel taşır, sohbet açılınca kapanır), dar
 * masaüstünde sağdan yan pencere, telefonda tam boy alt çekmece (Geri kapatır). Esc paneli kapatır.
 */
export function DetailFrame({ ctx, row, mode, onClose }) {
  const { t } = useLocale()
  const self = row ? row.upn.trim().toLowerCase() === ctx.myUpn : false
  const stopEscape = (e) => e.stopPropagation()
  const paneRef = useRef(null)
  // Bölme açılınca odak içine (Entra): Tab elli satırı dolaşmadan ayrıntıya varır.
  useEffect(() => {
    if (mode === "dock" && row?.id) paneRef.current?.focus({ preventScroll: true })
  }, [mode, row?.id])

  if (mode === "dock") {
    return (
      <PageDockPortal open={Boolean(row)} onClose={onClose} label={t("authz.ws.editor.title")}>
        {row && (
          <div
            ref={paneRef}
            tabIndex={-1}
            className="@container/detail flex h-full min-h-0 flex-col outline-none"
          >
            <Head row={row} self={self} onClose={onClose} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PersonDetail ctx={ctx} row={row} />
            </div>
          </div>
        )}
      </PageDockPortal>
    )
  }

  if (mode === "phone") {
    return (
      <BottomSheet
        open={Boolean(row)}
        onOpenChange={(o) => !o && onClose()}
        title={row?.upn.split("@")[0] ?? ""}
        description={row?.upn}
        closeOnBack
        onEscapeKeyDown={stopEscape}
        className="h-[92dvh]"
        footer={row && draftState(ctx, row).dirty ? <SaveBar ctx={ctx} row={row} /> : null}
      >
        {row && (
          <div className="@container/detail -mx-4">
            <PersonDetail ctx={ctx} row={row} footerOutside />
          </div>
        )}
      </BottomSheet>
    )
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        onEscapeKeyDown={stopEscape}
        className="@container/detail flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
      >
        {row && (
          <>
            <SheetTitle className="sr-only">{t("authz.ws.editor.title")}</SheetTitle>
            <SheetDescription className="sr-only">{row.upn}</SheetDescription>
            <Head row={row} self={self} Title="div" />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PersonDetail ctx={ctx} row={row} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
