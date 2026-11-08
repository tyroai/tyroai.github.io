import { useMemo } from "react"
import { simulate } from "@/features/rm/lib/simulate"

/** Simülasyon hesabı; girdiler adresten gelen yalın değerler (kategori listesi virgüllü). */
export function useSimulation(st, plan, today, catsKey, weeks, h, from, hor) {
  return useMemo(
    () =>
      simulate(st, plan, { cats: catsKey.split(",").filter(Boolean), weeks, h, from, hor }, today),
    [st, plan, today, catsKey, weeks, h, from, hor],
  )
}
