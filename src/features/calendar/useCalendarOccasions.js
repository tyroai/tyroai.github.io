import { useMemo } from "react"
import { useMsal } from "@azure/msal-react"
import { useCelebrations } from "@/hooks/useCelebrations"
import { useMyCircle } from "@/hooks/useMyCircle"
import { useMyProfileDetails } from "@/hooks/useMyProfileDetails"
import { useMyTeam } from "@/hooks/useMyTeam"
import { useTeamDates } from "@/hooks/useTeamDates"
import {
  celebrationSignature,
  occasionsFromSignature,
  teamOccasionEntries,
} from "@/features/calendar/lib/occasions"
import { circleOf } from "@/lib/myCircle"

const lower = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()

/** Kişinin kendisi, ekip kişisi biçiminde (`relation: "self"`): kendi doğum günüm de takvimde. */
function useMeMember() {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const { details } = useMyProfileDetails()
  return useMemo(() => {
    const address = lower(details?.mail || account?.username)
    if (!address) return null
    return {
      id: "",
      name: details?.displayName || account?.name || address,
      address,
      upn: lower(details?.upn || account?.username) || address,
      employeeHireDate: details?.employeeHireDate ?? "",
      relation: "self",
    }
  }, [details, account])
}

/**
 * Takvimin kutlamaları: ben + ekip (İK tarihleri, istenen herhangi bir pencere) ve departman
 * arkadaşları (şirket listesinin bugünden 14 günlük dilimi: ek istek yok, daha ötesi bilinmiyor).
 * İK görünümü okunamazsa ekip tarihleri sessizce boş kalır; dönüş `{ entries, status }`
 * (`status`: "ok" · "loading" · "failed" — ekip listesinin durumu).
 */
export function useCalendarOccasions({ firstMs, lastMs, today }) {
  const team = useMyTeam()
  const me = useMeMember()
  const people = useMemo(() => (me ? [me, ...team.people] : team.people), [me, team.people])
  const dates = useTeamDates(people)
  const company = useCelebrations()
  const circle = useMyCircle()

  const teamEntries = useMemo(
    () =>
      people.length
        ? teamOccasionEntries(people, dates, new Date(firstMs), new Date(lastMs), today)
        : [],
    [people, dates, firstMs, lastMs, today],
  )
  // `useCelebrations` her çizimde yeni nesne döner: içerik özetinin dizesi anahtar.
  const signature = celebrationSignature(company, (mail) => circleOf(circle, mail) === "department")
  const departmentEntries = useMemo(
    () => occasionsFromSignature(signature, today),
    [signature, today],
  )
  const entries = useMemo(
    () => [...teamEntries, ...departmentEntries],
    [teamEntries, departmentEntries],
  )
  const status = team.status === "ready" ? "ok" : team.status === "loading" ? "loading" : "failed"
  return { entries, status }
}
