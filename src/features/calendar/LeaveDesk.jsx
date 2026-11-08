import { LazyRequestDialog } from "@/features/selfservice/request/LazyRequestDialog"
import { LazyRecordSheet } from "./LazyRecordSheet"
import { LeaveDeskContext } from "./leaveDeskContext"
import { useLeaveDeskState } from "./useLeaveDeskState"

/** Kapı açıkken: izin masasının durumu, bağlamı ve iki penceresi (form, ayrıntı). */
function DeskLoad({ leave, children }) {
  const { value, request, sheet } = useLeaveDeskState(leave)
  return (
    <LeaveDeskContext value={value}>
      {children}
      <LazyRequestDialog {...request} />
      <LazyRecordSheet {...sheet} />
    </LeaveDeskContext>
  )
}

/**
 * Takvimin izin masası: Self Servis'in izin talebi formu ve kayıt ayrıntısı takvimin ÜSTÜNDE
 * açılır, kişi sayfadan ayrılmaz (Yeni › İzin talebi, boş güne basış, tatilin "İzin iste"si,
 * benim izin çipim, alt listenin satırı). Bağlamı alt bileşenler `useLeaveDesk()` ile okur.
 * `leave`: `LeaveSource`un değeri; kapı kapalıysa (`null`) masa yok ve hiçbir kanca çalışmaz.
 */
export function LeaveDesk({ leave, children }) {
  if (!leave) return children
  return <DeskLoad leave={leave}>{children}</DeskLoad>
}
