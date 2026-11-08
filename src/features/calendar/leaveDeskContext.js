import { createContext, useContext } from "react"

/**
 * İzin masasının bağlamı (`LeaveDesk`): `{ person, openId, newKeys, newLeave(gün, açanÖğe, anlat?),
 * openLeave(kayıt) }`. İzin kapısı (`access.selfService`) kapalıysa `null`: izin açan hiçbir
 * yüzey çizilmez.
 */
export const LeaveDeskContext = createContext(null)

export const useLeaveDesk = () => useContext(LeaveDeskContext)
