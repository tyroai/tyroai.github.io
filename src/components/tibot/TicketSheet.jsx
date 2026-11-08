import "@/lib/i18n/tibot"
import LinkSquare02Icon from "@hugeicons/core-free-icons/LinkSquare02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { RecordBar, RecordButton } from "@/components/record-window/RecordBar"
import { RecordFrame, RecordPaper } from "@/components/record-window/RecordFrame"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { ticketUrl } from "@/lib/tibot/tibotModel"
import { cn } from "@/lib/utils"
import { TicketContent } from "./TicketDetail"
import { useTicket } from "./useTicket"
import "./tibot.css"

/** Xurrent'te aç: uzman (atanan ya da ekipte) talep ekranına, talep eden self servis ekranına. */
function useOpenInXurrent(row, ticket) {
  const staff = ticket.data?.staff ?? row?.bucket !== "mine"
  return () => window.open(ticketUrl(row.requestId, staff), "_blank", "noopener,noreferrer")
}

/**
 * Talebin ayrıntısı — Self Servis kaydının penceresiyle aynı: masaüstünde ortada pencere (üst
 * şerit: kapat, "Xurrent talebi", "Xurrent'te aç"), telefonda alttan çekmece (eylem alt şeritte).
 * `row` listeden gelir (`bucket` alanıyla); kapanınca odak açan satıra döner.
 */
export function TicketSheet({ row, onOpenChange }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const back = useReturnFocus()
  const ticket = useTicket(row)
  const openXurrent = useOpenInXurrent(row, ticket)
  const open = Boolean(row)
  const head = ticket.data?.request ?? row
  const content = row && (
    <TicketContent
      row={head}
      notes={ticket.data?.notes ?? null}
      status={ticket.status}
      // Kendi açtığın ve işini yapmadığın talep: "Senden yanıt bekleniyor".
      mine={row.bucket === "mine" && !ticket.data?.staff}
    />
  )
  const action = (className) =>
    row && (
      <RecordButton
        icon={LinkSquare02Icon}
        variant="primary"
        onClick={openXurrent}
        className={className}
      >
        {t("tibot.openInXurrent")}
      </RecordButton>
    )
  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("tibot.window.kind")}
        description={row ? `#${row.requestId} · ${row.subject}` : undefined}
        className="max-h-[92dvh] data-[side=bottom]:h-[92dvh]"
        footer={<div className="rw-foot">{action("w-full justify-center")}</div>}
      >
        {row && <RecordPaper className="rw-sheet--flat">{content}</RecordPaper>}
      </BottomSheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={back.onOpenAutoFocus}
        onCloseAutoFocus={back.onCloseAutoFocus}
        className={cn(
          "flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[1.375rem] p-0 sm:max-h-[88dvh] sm:pb-0",
          "tb-window",
        )}
      >
        <DialogTitle className="sr-only">
          {row ? `#${row.requestId} ${row.subject}` : ""}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("tibot.window.kind")}</DialogDescription>
        {row && (
          <RecordFrame
            bar={
              <RecordBar
                title={t("tibot.window.kind")}
                onClose={() => onOpenChange(false)}
                closeLabel={t("tibot.close")}
              >
                {action()}
              </RecordBar>
            }
          >
            {content}
          </RecordFrame>
        )}
      </DialogContent>
    </Dialog>
  )
}
